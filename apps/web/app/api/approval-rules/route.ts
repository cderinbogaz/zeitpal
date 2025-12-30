import { NextRequest } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';

import { auth } from '~/lib/auth/auth';
import {
  badRequest,
  created,
  forbidden,
  success,
  unauthorized,
  validationError,
} from '~/lib/api/responses';


interface ApprovalRuleRow {
  id: string;
  organization_id: string;
  name: string;
  conditions: string;
  approver_type: string;
  approver_user_id: string | null;
  level: number;
  priority: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const createApprovalRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  conditions: z
    .object({
      leaveTypes: z.array(z.string()).optional(),
      minDays: z.number().optional(),
      maxDays: z.number().optional(),
    })
    .optional()
    .default({}),
  approverType: z.enum([
    'team_lead',
    'manager',
    'hr',
    'specific_user',
    'any_admin',
  ]),
  approverUserId: z.string().nullable().optional(),
  level: z.number().min(1).max(5).default(1),
  priority: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/approval-rules
 * Get approval rules for the organization
 */
export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization
  const membership = await db
    .prepare(
      `SELECT om.organization_id, om.role
       FROM organization_members om
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership) {
    return badRequest('You are not a member of any organization');
  }

  // Only admin, manager, hr can view approval rules
  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can view approval rules');
  }

  const result = await db
    .prepare(
      `SELECT ar.*, u.name as approver_name, u.email as approver_email
       FROM approval_rules ar
       LEFT JOIN users u ON ar.approver_user_id = u.id
       WHERE ar.organization_id = ?
       ORDER BY ar.level ASC, ar.priority DESC`
    )
    .bind(membership.organization_id)
    .all<ApprovalRuleRow & { approver_name: string | null; approver_email: string | null }>();

  const rules = result.results.map((row: ApprovalRuleRow & { approver_name: string | null; approver_email: string | null }) => ({
    id: row.id,
    name: row.name,
    conditions: JSON.parse(row.conditions || '{}'),
    approverType: row.approver_type,
    approverUserId: row.approver_user_id,
    approverName: row.approver_name,
    approverEmail: row.approver_email,
    level: row.level,
    priority: row.priority,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return success(rules);
}

/**
 * POST /api/approval-rules
 * Create a new approval rule
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return unauthorized();
  }

  const { env } = getCloudflareContext();
  const db = env.DB;

  // Get user's organization membership and verify role
  const membership = await db
    .prepare(
      `SELECT om.organization_id, om.role
       FROM organization_members om
       WHERE om.user_id = ? AND om.status = 'active'
       LIMIT 1`
    )
    .bind(session.user.id)
    .first<{ organization_id: string; role: string }>();

  if (!membership) {
    return badRequest('You are not a member of any organization');
  }

  if (!['admin', 'manager', 'hr'].includes(membership.role)) {
    return forbidden('Only admins, managers, and HR can create approval rules');
  }

  const body = await request.json();
  const parsed = createApprovalRuleSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.flatten());
  }

  const {
    name,
    conditions,
    approverType,
    approverUserId,
    level,
    priority,
    isActive,
  } = parsed.data;

  // Validate approverUserId is provided if approverType is specific_user
  if (approverType === 'specific_user' && !approverUserId) {
    return badRequest('Approver user ID is required for specific_user type');
  }

  const ruleId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO approval_rules (
        id, organization_id, name, conditions, approver_type, approver_user_id,
        level, priority, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      ruleId,
      membership.organization_id,
      name,
      JSON.stringify(conditions),
      approverType,
      approverUserId || null,
      level,
      priority,
      isActive ? 1 : 0,
      now,
      now
    )
    .run();

  return created({
    id: ruleId,
    name,
    conditions,
    approverType,
    approverUserId,
    level,
    priority,
    isActive,
  });
}

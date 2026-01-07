import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock dependencies
vi.mock('~/lib/auth/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: vi.fn(),
}));

vi.mock('~/lib/emails', () => ({
  sendMemberInvitationEmail: vi.fn(),
}));

vi.mock('~/lib/services/email.service', () => ({
  getSiteUrl: vi.fn(() => 'https://test.zeitpal.com'),
}));

// Import mocked modules
import { auth } from '~/lib/auth/auth';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { sendMemberInvitationEmail } from '~/lib/emails';

// Helper to create a mock NextRequest
function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/onboarding/complete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Helper to create mock D1 database
function createMockDb() {
  const mockStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn(),
    all: vi.fn(),
    run: vi.fn(),
  };

  return {
    prepare: vi.fn(() => mockStatement),
    batch: vi.fn().mockResolvedValue([]),
    mockStatement,
  };
}

describe('POST /api/onboarding/complete', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockDb();

    // Default mock for getCloudflareContext
    vi.mocked(getCloudflareContext).mockReturnValue({
      env: { DB: mockDb },
      ctx: { waitUntil: vi.fn() },
    } as ReturnType<typeof getCloudflareContext>);

    // Default mock for leave types query
    mockDb.mockStatement.all.mockResolvedValue({
      results: [
        { id: 'lt-vacation', code: 'vacation', default_days_per_year: 30, has_allowance: 1 },
        { id: 'lt-sick', code: 'sick', default_days_per_year: null, has_allowance: 0 },
      ],
    });

    // Mock sendMemberInvitationEmail to resolve
    vi.mocked(sendMemberInvitationEmail).mockResolvedValue();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when session has no user id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: { email: 'test@test.com' } } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@test.com', name: 'Test User' },
      } as Awaited<ReturnType<typeof auth>>);
    });

    it('should return 400 for missing organization name', async () => {
      const request = createMockRequest({
        organizationSlug: 'test-org',
        country: 'DE',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid organization slug format', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'Test Org Invalid!', // Invalid characters
        country: 'DE',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing country', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid invite email format', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        invites: [{ email: 'not-an-email', role: 'employee' }],
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid invite role', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        invites: [{ email: 'valid@test.com', role: 'invalid-role' }],
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Successful Onboarding', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@test.com', name: 'Test User' },
      } as Awaited<ReturnType<typeof auth>>);
    });

    it('should create organization successfully with minimal data', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.success).toBe(true);
      expect(json.data.organizationSlug).toBe('test-org');
      expect(json.data.invitesSent).toBe(0);
      expect(mockDb.batch).toHaveBeenCalled();
    });

    it('should create organization with team', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        teamName: 'Engineering',
        teamColor: '#FF5733',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.success).toBe(true);
      expect(json.data.teamId).toBeDefined();
    });

    it('should create organization with policy settings', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        defaultVacationDays: 25,
        carryoverEnabled: true,
        carryoverMaxDays: 10,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.success).toBe(true);
    });

    it('should handle non-German countries', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'AT', // Austria
        region: 'Vienna',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.success).toBe(true);
    });

    it('should complete onboarding when user exists with the same email', async () => {
      mockDb.mockStatement.first.mockResolvedValue({ id: 'existing-user' });

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.success).toBe(true);
    });
  });

  describe('Invitations', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@test.com', name: 'Admin User' },
      } as Awaited<ReturnType<typeof auth>>);
    });

    it('should create invites and send emails', async () => {
      const invites = [
        { email: 'employee1@test.com', role: 'employee' },
        { email: 'manager@test.com', role: 'manager' },
      ];

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        invites,
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.invitesSent).toBe(2);

      // Verify emails were sent for each invite
      expect(sendMemberInvitationEmail).toHaveBeenCalledTimes(2);
    });

    it('should send email with correct data', async () => {
      const request = createMockRequest({
        organizationName: 'Awesome Company',
        organizationSlug: 'awesome-company',
        country: 'DE',
        displayName: 'John Admin',
        invites: [{ email: 'newhire@test.com', role: 'employee' }],
      });

      await POST(request);

      expect(sendMemberInvitationEmail).toHaveBeenCalledWith(
        expect.anything(), // env
        expect.objectContaining({
          inviteeEmail: 'newhire@test.com',
          organizationName: 'Awesome Company',
          inviterName: 'John Admin',
          role: 'employee',
          inviteUrl: expect.stringContaining('https://test.zeitpal.com/invite/'),
          expiresAt: expect.any(String),
        })
      );
    });

    it('should lowercase email addresses', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        invites: [{ email: 'UPPER@TEST.COM', role: 'employee' }],
      });

      await POST(request);

      expect(sendMemberInvitationEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          inviteeEmail: 'upper@test.com',
        })
      );
    });

    it('should associate invites with team if team is created', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        teamName: 'Engineering',
        invites: [{ email: 'engineer@test.com', role: 'employee' }],
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.teamId).toBeDefined();
      expect(json.data.invitesSent).toBe(1);
    });

    it('should handle email sending failure gracefully', async () => {
      vi.mocked(sendMemberInvitationEmail).mockRejectedValue(new Error('Email service unavailable'));

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        invites: [{ email: 'test@test.com', role: 'employee' }],
      });

      // The request should still succeed even if email fails
      // (emails are fire-and-forget with error logging)
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.success).toBe(true);
      expect(json.data.invitesSent).toBe(1);
    });

    it('should use email prefix as invitee name', async () => {
      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        invites: [{ email: 'john.doe@company.com', role: 'employee' }],
      });

      await POST(request);

      expect(sendMemberInvitationEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          inviteeName: 'john.doe',
        })
      );
    });

    it('should use session user name as fallback for inviter name', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@test.com', name: 'Admin Name' },
      } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        // No displayName provided
        invites: [{ email: 'test@test.com', role: 'employee' }],
      });

      await POST(request);

      expect(sendMemberInvitationEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          inviterName: 'Admin Name',
        })
      );
    });

    it('should use email as last fallback for inviter name', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'admin@test.com' }, // No name
      } as Awaited<ReturnType<typeof auth>>);

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
        // No displayName provided
        invites: [{ email: 'test@test.com', role: 'employee' }],
      });

      await POST(request);

      expect(sendMemberInvitationEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          inviterName: 'admin@test.com',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'user-123', email: 'test@test.com', name: 'Test User' },
      } as Awaited<ReturnType<typeof auth>>);
    });

    it('should return 400 for duplicate organization slug', async () => {
      mockDb.batch.mockRejectedValue(
        new Error('UNIQUE constraint failed: organizations.slug')
      );

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'existing-org',
        country: 'DE',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already exists');
    });

    it('should return 500 for unexpected database errors', async () => {
      mockDb.batch.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        country: 'DE',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});

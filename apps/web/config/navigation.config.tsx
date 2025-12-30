import {
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileText,
  Home,
  User,
  Users,
  Building2,
  UserPlus,
  Palmtree,
  Calendar,
  Shield,
  BarChart3,
} from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.application',
    children: [
      {
        label: 'common:routes.home',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'common:routes.leave',
        path: pathsConfig.app.leave,
        Icon: <ClipboardList className={iconClasses} />,
      },
      {
        label: 'common:routes.calendar',
        path: pathsConfig.app.calendar,
        Icon: <CalendarDays className={iconClasses} />,
      },
      {
        label: 'common:routes.approvals',
        path: pathsConfig.app.approvals,
        Icon: <CheckSquare className={iconClasses} />,
      },
      {
        label: 'common:routes.team',
        path: pathsConfig.app.team,
        Icon: <Users className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.admin',
    children: [
      {
        label: 'common:routes.organization',
        path: pathsConfig.app.adminOrganization,
        Icon: <Building2 className={iconClasses} />,
      },
      {
        label: 'common:routes.members',
        path: pathsConfig.app.adminMembers,
        Icon: <UserPlus className={iconClasses} />,
      },
      {
        label: 'common:routes.leaveTypes',
        path: pathsConfig.app.adminLeaveTypes,
        Icon: <Palmtree className={iconClasses} />,
      },
      {
        label: 'common:routes.policies',
        path: pathsConfig.app.adminPolicies,
        Icon: <FileText className={iconClasses} />,
      },
      {
        label: 'common:routes.holidays',
        path: pathsConfig.app.adminHolidays,
        Icon: <Calendar className={iconClasses} />,
      },
      {
        label: 'common:routes.approvalRules',
        path: pathsConfig.app.adminApprovals,
        Icon: <Shield className={iconClasses} />,
      },
      {
        label: 'common:routes.reports',
        path: pathsConfig.app.adminReports,
        Icon: <BarChart3 className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});

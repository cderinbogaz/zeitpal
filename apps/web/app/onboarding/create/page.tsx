import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';

import { CreateOrgWizard } from './_components/create-org-wizard';


export default function CreateOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Organization</CardTitle>
          <CardDescription>
            Set up your organization to start tracking leave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgWizard />
        </CardContent>
      </Card>
    </div>
  );
}

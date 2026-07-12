import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = {
  title: 'Unauthorized',
  description: 'You do not have permission to access this resource.',
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">Unauthorized</CardTitle>
          <CardDescription>
            You do not have permission to view this page. Contact an
            administrator if you believe this is a mistake.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Error code: 401
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            nativeButton={false}
            render={<Link href={ROUTES.dashboard} />}
          >
            Go to dashboard
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.login} />}
          >
            Sign in
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

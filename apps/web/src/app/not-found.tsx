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
  title: 'Page not found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">Page not found</CardTitle>
          <CardDescription>
            The page you requested does not exist or may have been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Error code: 404
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button nativeButton={false} render={<Link href={ROUTES.home} />}>
            Go home
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={ROUTES.dashboard} />}
          >
            Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Pengaturan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p className="text-muted-foreground">Nama: {session?.user?.name ?? "-"}</p>
          <p className="text-muted-foreground">Email: {session?.user?.email ?? "-"}</p>
        </CardContent>
      </Card>
    </div>
  );
}

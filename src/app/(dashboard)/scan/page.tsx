import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScanPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Scan Struk</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload foto struk</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {/* TODO: ReceiptUploadDropzone (lihat react-component-skill.md) → POST /api/receipts → job OCR async → OcrReviewForm */}
          Komponen upload & alur review OCR belum diimplementasikan — lihat F-01/F-02 di PRD dan
          nextjs-server-action-skill.md untuk pola job async.
        </CardContent>
      </Card>
    </div>
  );
}

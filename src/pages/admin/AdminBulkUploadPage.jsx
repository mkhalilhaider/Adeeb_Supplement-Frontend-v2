import { lazy, Suspense, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { errorMessage } from "../../lib/api/errors";
import { bulkUploadProducts } from "../../features/admin/api";
import { AdminHeader, Panel, Table } from "../../features/admin/ui";
import { td, th } from "../../features/admin/format";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

const COLUMNS = [
  ["name", "Product name. Rows with the same name become variants of one product."],
  ["description", "Product description"],
  ["category", "Category name, slug or id"],
  ["brand", "Brand name, slug or id"],
  ["isFeatured", "true / false"],
  ["flavor", "Variant flavour"],
  ["weight", "Variant weight or size"],
  ["serving", "Variant servings"],
  ["price", "Price in rupees"],
  ["salePrice", "Optional sale price"],
  ["stockQuantity", "Units in stock"],
  ["isDefault", "true for the variant shown first"],
];

/** /admin/products/bulk — create many products from an Excel sheet, with per-row errors. */
export default function BulkUploadPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(/** @type {File|null} */ (null));
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(/** @type {any} */ (null));
  const [error, setError] = useState("");

  const pick = (e) => {
    const f = e.target.files?.[0] ?? null;
    setResult(null);
    setError("");
    if (f && !/\.(xlsx|xls)$/i.test(f.name)) {
      setError("Choose an Excel file (.xlsx or .xls)");
      setFile(null);
      return;
    }
    if (f && f.size > 10 * 1024 * 1024) {
      setError("The file must be 10 MB or smaller");
      setFile(null);
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    setPending(true);
    setError("");
    try {
      const data = await bulkUploadProducts(file);
      setResult(data);
      setConfirming(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
    } catch (err) {
      setError(errorMessage(err));
      setConfirming(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title="Bulk upload"
        description="Create products from an Excel sheet. Each row is one variant."
      />

      <Panel title="Upload a sheet">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-4 py-2.5 text-small font-semibold hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink">
            <FileSpreadsheet aria-hidden="true" className="size-4" />
            {file ? file.name : "Choose Excel file"}
            <input type="file" accept=".xlsx,.xls" onChange={pick} className="sr-only" />
          </label>
          <Button onClick={() => setConfirming(true)} disabled={!file} loading={pending}>
            Upload products
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-small text-danger">
            {error}
          </p>
        )}
      </Panel>

      {result && (
        <Panel title="Result" className="mt-6">
          <p role="status" className="text-small">
            <strong>{result.createdCount}</strong> product{result.createdCount === 1 ? "" : "s"}{" "}
            created
            {result.errorCount ? (
              <>
                , <strong className="text-danger">{result.errorCount}</strong> row
                {result.errorCount === 1 ? "" : "s"} with errors
              </>
            ) : (
              ""
            )}
            .
          </p>
          {result.errors?.length > 0 && (
            <Table label="Rows with errors" className="mt-3">
              <thead>
                <tr>
                  <th className={th}>Row / product</th>
                  <th className={th}>Problem</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((e, i) => (
                  <tr key={i}>
                    <td className={`${td} whitespace-nowrap`}>{e.row ?? e.product ?? "—"}</td>
                    <td className={td}>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      )}

      <Panel title="Columns" className="mt-6">
        <p className="mb-3 text-small text-ink-2">The first row must hold these column names:</p>
        <dl className="grid gap-x-6 gap-y-2 text-small sm:grid-cols-[10rem_1fr]">
          {COLUMNS.map(([name, help]) => (
            <div key={name} className="contents">
              <dt className="font-mono font-semibold">{name}</dt>
              <dd className="text-ink-2">{help}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      {confirming && (
        <Suspense fallback={null}>
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setConfirming(false)}
            title="Create products from this sheet?"
            description={`Every valid row in ${file?.name} becomes live in the store straight away. Rows with errors are skipped and listed afterwards.`}
            confirmLabel="Upload"
            tone="neutral"
            pending={pending}
            onConfirm={upload}
          />
        </Suspense>
      )}
    </div>
  );
}

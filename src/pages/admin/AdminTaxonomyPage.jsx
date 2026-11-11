import { lazy, Suspense, useState } from "react";
import { useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CirclePlus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { CloudImage } from "../../components/ui/CloudImage";
import { Field } from "../../components/ui/Field";
import { Input, Textarea } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { errorMessage } from "../../lib/api/errors";
import { notify } from "../../lib/notify";
import { useTaxonomy } from "../../features/catalog/useTaxonomy";
import { createTaxon, deleteTaxon, updateTaxon } from "../../features/admin/api";
import { ImageUpload } from "../../features/admin/components/ImageUpload";
import { AdminHeader, EmptyRow, Table } from "../../features/admin/ui";
import { td, th } from "../../features/admin/format";

const Dialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.Dialog })),
);
const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

const KINDS = {
  categories: {
    title: "Categories",
    one: "category",
    image: "imageUrl",
    publicId: "imagePublicId",
    imageLabel: "Category photo",
  },
  brands: {
    title: "Brands",
    one: "brand",
    image: "logoUrl",
    publicId: "logoPublicId",
    imageLabel: "Brand logo",
  },
};

function EditDialog({ kind, item, onClose }) {
  const conf = KINDS[kind];
  const queryClient = useQueryClient();
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [image, setImage] = useState(
    item?.[conf.image] ? { url: item[conf.image], publicId: item[conf.publicId] } : null,
  );
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [pending, setPending] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2) return setNameError("Enter a name");
    setPending(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        description: description.trim(),
        [conf.image]: image?.url ?? "",
        [conf.publicId]: image?.publicId ?? "",
      };
      if (item) await updateTaxon(kind, item._id, body);
      else await createTaxon(kind, body);
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      notify.success(item ? `Saved ${body.name}` : `Added ${body.name}`);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !pending && onClose()}
      title={item ? `Edit ${item.name}` : `Add ${conf.one}`}
      description={
        item
          ? "Changing the name also changes the page address (old links redirect only if you keep the slug)."
          : undefined
      }
      size="md"
    >
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <ImageUpload label={conf.imageLabel} value={image} onChange={setImage} />
          <Field label="Name" required error={nameError} className="flex-1">
            {(f) => (
              <Input
                {...f}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
              />
            )}
          </Field>
        </div>
        <Field label="Description" hint="Optional — shown on the listing page and in link previews">
          {(f) => (
            <Textarea
              {...f}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>
        {error && (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" loading={pending}>
            {item ? "Save" : "Add"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** /admin/categories and /admin/brands — same screen for both. */
export default function TaxonomyPage() {
  const { pathname } = useLocation();
  const kind = pathname.includes("brands") ? "brands" : "categories";
  const conf = KINDS[kind];
  const queryClient = useQueryClient();
  const taxonomy = useTaxonomy();
  const list = kind === "brands" ? taxonomy.brands : taxonomy.categories;
  const [editing, setEditing] = useState(/** @type {any} */ (null));
  const [removing, setRemoving] = useState(/** @type {any} */ (null));
  const [pending, setPending] = useState(false);

  const remove = async () => {
    setPending(true);
    try {
      await deleteTaxon(kind, removing._id);
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
      notify.success(`Deleted ${removing.name}`);
      setRemoving(null);
    } catch (err) {
      notify.error(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={conf.title}
        description={`Adding a ${conf.one} with the name of a deleted one brings the old one back.`}
        actions={
          <Button leadingIcon={<CirclePlus className="size-4" />} onClick={() => setEditing({})}>
            Add {conf.one}
          </Button>
        }
      />
      {taxonomy.error && !list.length ? (
        <ErrorState error={taxonomy.error} onRetry={taxonomy.refetch} />
      ) : taxonomy.isPending && !list.length ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <Table label={conf.title}>
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Address</th>
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <EmptyRow colSpan={3}>Nothing here yet.</EmptyRow>}
            {list.map((item) => (
              <tr key={item._id}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <span className="size-12 shrink-0 bg-shelf p-1">
                      <CloudImage
                        src={item[conf.image]}
                        alt=""
                        ratio={null}
                        fit="contain"
                        sizes="48px"
                        className="size-full"
                      />
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className={`${td} font-mono text-[12px] text-ink-2`}>
                  /{kind === "brands" ? "brand" : "category"}/{item.slug}
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => setEditing(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ml-3 text-danger underline"
                    onClick={() => setRemoving(item)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Suspense fallback={null}>
        {editing && (
          <EditDialog
            kind={kind}
            item={editing._id ? editing : null}
            onClose={() => setEditing(null)}
          />
        )}
        {removing && (
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setRemoving(null)}
            title={`Delete ${removing.name}?`}
            description={`It disappears from the store menu and its page stops working. Products in this ${conf.one} stay, but lose their ${conf.one} page.`}
            confirmLabel={`Delete ${conf.one}`}
            pending={pending}
            onConfirm={remove}
          />
        )}
      </Suspense>
    </div>
  );
}

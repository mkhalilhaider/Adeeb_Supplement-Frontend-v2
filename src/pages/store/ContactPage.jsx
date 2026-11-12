import { useState } from "react";
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input, Textarea } from "../../components/ui/Input";
import { site, whatsappLink } from "../../config/site";
import { api } from "../../lib/api";
import { errorMessage } from "../../lib/api/errors";
import { normalizePkPhone } from "../../lib/format";
import { useForm } from "../../lib/use-form";
import { useSession } from "../../features/auth/session-store";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v) {
  const errors = {};
  if (v.name.trim().length < 2) errors.name = "Enter your name";
  if (!v.phone.trim()) errors.phone = "Enter a phone number we can reach you on";
  else if (!normalizePkPhone(v.phone) && v.phone.replace(/\D/g, "").length < 10)
    errors.phone = "Enter a valid phone number";
  if (v.email.trim() && !EMAIL.test(v.email.trim()))
    errors.email = "Enter a valid email, or leave it empty";
  if (v.message.trim().length < 5) errors.message = "Tell us a little more";
  return errors;
}

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    text: site.contact.phoneDisplay,
    href: whatsappLink("Hi Adeeb Supplement, I have a question."),
    external: true,
  },
  {
    icon: Phone,
    title: "Call",
    text: site.contact.phoneDisplay,
    href: `tel:${site.contact.phoneIntl}`,
  },
  { icon: Mail, title: "Email", text: site.contact.email, href: `mailto:${site.contact.email}` },
  {
    icon: MapPin,
    title: site.store.label,
    text: site.store.address,
    href: site.store.mapsUrl,
    external: true,
  },
];

/** /contact — every way to reach the shop, plus a message form (POST /contact, 10 per hour). */
export default function ContactPage() {
  const user = useSession((s) => s.user);
  const form = useForm(() => ({
    name: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "",
    phone: "",
    email: user?.email ?? "",
    message: "",
  }));
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const onValid = async (v) => {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await api.post("/contact", {
        name: v.name.trim(),
        phone: normalizePkPhone(v.phone) ?? v.phone.trim(),
        email: v.email.trim() || undefined,
        message: v.message.trim(),
      });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="page-container pb-16">
      <Seo
        title="Contact us"
        description={`Questions about supplements or an order? WhatsApp or call ${site.contact.phoneDisplay}, email us, or visit our store in Gulshan-e-Iqbal, Karachi.`}
        canonicalPath="/contact"
      />
      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[{ label: "Home", to: "/" }, { label: "Contact" }]}
      />
      <h1 className="mt-4 text-[2.75rem] font-display md:text-[4rem]">Contact us</h1>
      <p className="mt-2 max-w-[56ch] text-ink-2">
        Questions about a product, your order or the right supplement for your goal? WhatsApp is the
        fastest way to reach us.
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <ul className="flex flex-col gap-3">
          {CHANNELS.map(({ icon: Icon, title, text, href, external }) => (
            <li key={title}>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-start gap-4 rounded-sm border border-line bg-surface p-4 transition-colors duration-(--duration-fast) hover:border-ink-3"
              >
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-small break-words text-ink-2">{text}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <section
          aria-labelledby="form-heading"
          className="rounded-sm border border-line bg-surface p-5 md:p-6"
        >
          <h2 id="form-heading" className="text-h3 font-bold">
            Send us a message
          </h2>
          {sent ? (
            <div role="status" className="mt-4 flex flex-col items-start gap-3">
              <CheckCircle2 aria-hidden="true" className="size-8 text-success" />
              <p>Thanks — we've got your message and will get back to you soon.</p>
              <Button variant="outline" onClick={() => setSent(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(event) => form.handleSubmit(validate, onValid)(event)}
              noValidate
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <Field label="Name" required error={form.errors.name}>
                {(f) => <Input {...f} {...form.field("name")} autoComplete="name" />}
              </Field>
              <Field label="Phone" required error={form.errors.phone}>
                {(f) => (
                  <Input
                    {...f}
                    {...form.field("phone")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0300 1234567"
                  />
                )}
              </Field>
              <Field
                className="sm:col-span-2"
                label="Email"
                hint="Optional"
                error={form.errors.email}
              >
                {(f) => (
                  <Input
                    {...f}
                    {...form.field("email")}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                  />
                )}
              </Field>
              <Field className="sm:col-span-2" label="Message" required error={form.errors.message}>
                {(f) => <Textarea {...f} {...form.field("message")} rows={5} maxLength={2000} />}
              </Field>
              {error && (
                <p
                  role="alert"
                  className="rounded-sm bg-danger-soft px-3 py-2 text-small text-danger sm:col-span-2"
                >
                  {error}
                </p>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" loading={pending}>
                  Send message
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

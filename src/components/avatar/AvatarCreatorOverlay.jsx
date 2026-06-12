import { useEffect, useRef, useState } from "react";
import { X, Wand2, Trash2, ShieldCheck, Camera, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import SpritePhotoshopPanel from "@/components/admin/walkthrough/SpritePhotoshopPanel";
import AvatarPreview3D from "./AvatarPreview3D";
import { uploadAvatarMedia, deleteAvatarMedia } from "@/lib/upload";
import { clampHeightScale } from "@/lib/avatar-config";
import {
  SKIN_TONES, BODY_BUILDS, HEIGHT_RANGE, HAIR_STYLES, HAIR_COLORS, OUTFIT_COLORS,
  ACCESSORIES, VIEW_MODES, QUALITY_TIERS, SOURCE_PHOTO_TYPE_OPTIONS, SOURCE_PHOTO_TYPES,
  AVATAR_CONSENT_COPY, AVATAR_PRIVACY_NOTES,
} from "@/lib/avatar-seed";

// Full-screen avatar creation / re-customization overlay. Steps:
//   intro -> photo (optional) -> customize -> save
export default function AvatarCreatorOverlay({ open, onClose, initialConfig, hasAvatar, onSave, onDelete, ownerKey }) {
  const [step, setStep] = useState("intro");
  const [draft, setDraft] = useState(initialConfig);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [photoChoice, setPhotoChoice] = useState(SOURCE_PHOTO_TYPES.NONE);
  const [stagedFile, setStagedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(initialConfig);
      setAgeConfirmed(!!initialConfig?.age_confirmed);
      setConsentChecked(!!initialConfig?.consent_given_at);
      setPhotoChoice(initialConfig?.source_photo_type || SOURCE_PHOTO_TYPES.NONE);
      setStep(hasAvatar ? "customize" : "intro");
      setStagedFile(null);
      setUploadStatus("");
      setConfirmDelete(false);
    }
    wasOpenRef.current = open;
  }, [open, initialConfig, hasAvatar]);

  if (!open) return null;

  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));

  const acceptCutoutFile = async (file) => {
    setUploadStatus("Uploading…");
    try {
      const { file_url } = await uploadAvatarMedia(file, ownerKey || "anon");
      const isSelfie = photoChoice === SOURCE_PHOTO_TYPES.SELFIE;
      await Promise.all([deleteAvatarMedia(draft.face_cutout_url), deleteAvatarMedia(draft.body_cutout_url)]);
      update({
        face_cutout_url: isSelfie ? file_url : null,
        body_cutout_url: isSelfie ? null : file_url,
        source_photo_type: photoChoice,
      });
      setStagedFile(null);
      setUploadStatus("");
      setStep("customize");
    } catch (err) {
      setUploadStatus(err?.message || "Upload failed. Please try again.");
    }
  };

  const acceptCutout = ({ blob }) => acceptCutoutFile(new File([blob], "avatar-cutout.png", { type: blob.type || "image/png" }));
  const useOriginalPhoto = () => { if (stagedFile) acceptCutoutFile(stagedFile); };

  const removePhoto = async () => {
    await Promise.all([deleteAvatarMedia(draft.face_cutout_url), deleteAvatarMedia(draft.body_cutout_url)]);
    update({ face_cutout_url: null, body_cutout_url: null, source_photo_type: SOURCE_PHOTO_TYPES.NONE });
    setPhotoChoice(SOURCE_PHOTO_TYPES.NONE);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        ...draft,
        age_confirmed: ageConfirmed || draft.age_confirmed,
        consent_given_at: consentChecked ? (draft.consent_given_at || now) : draft.consent_given_at,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDelete();
      setConfirmDelete(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasCutout = !!(draft.face_cutout_url || draft.body_cutout_url);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
          <div>
            <h2 className="font-display text-xl font-bold">{AVATAR_CONSENT_COPY.title}</h2>
            <p className="text-xs text-muted-foreground">
              {step === "intro" && "A few quick steps to create your platform-wide 3D avatar."}
              {step === "photo" && "Upload a photo to base your avatar on, or skip to use a default body."}
              {step === "customize" && "Customize your avatar, preview it, then save."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === "intro" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-foreground/85">
                <p>{AVATAR_CONSENT_COPY.intro}</p>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {AVATAR_CONSENT_COPY.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span>{bullet}</span></li>
                  ))}
                </ul>
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/40 p-3 text-sm">
                <Checkbox checked={ageConfirmed} onCheckedChange={(v) => setAgeConfirmed(Boolean(v))} className="mt-0.5" />
                <span>{AVATAR_CONSENT_COPY.ageLabel}</span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/40 p-3 text-sm">
                <Checkbox checked={consentChecked} onCheckedChange={(v) => setConsentChecked(Boolean(v))} className="mt-0.5" />
                <span>{AVATAR_CONSENT_COPY.consentLabel}</span>
              </label>
              {AVATAR_PRIVACY_NOTES.map((note) => <p key={note} className="text-[11px] text-muted-foreground">{note}</p>)}
            </div>
          )}

          {step === "photo" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose how to build your avatar's appearance, or skip to use a fully customizable default body.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOURCE_PHOTO_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPhotoChoice(opt.id)}
                    className={`rounded-2xl border p-4 text-left transition ${photoChoice === opt.id ? "border-primary bg-primary/10" : "border-white/10 bg-background/40 hover:border-white/20"}`}
                  >
                    <p className="font-semibold">{opt.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                  </button>
                ))}
              </div>

              {photoChoice !== SOURCE_PHOTO_TYPES.NONE && (
                <div className="space-y-3 rounded-2xl border border-white/10 bg-background/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Upload a photo — only of yourself, with consent</p>
                  <Button asChild variant="outline">
                    <label className="cursor-pointer">
                      <Camera className="h-4 w-4" /> Choose photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setStagedFile(e.target.files?.[0] || null)} />
                    </label>
                  </Button>
                  {stagedFile && (
                    <SpritePhotoshopPanel
                      file={stagedFile}
                      title="Trace & cut out your photo"
                      description="Adjust the focus box so it traces you, then use the prepared cutout for your avatar."
                      acceptLabel="Use this cutout"
                      onAccept={acceptCutout}
                      onUseOriginal={useOriginalPhoto}
                      onCancel={() => setStagedFile(null)}
                    />
                  )}
                  {uploadStatus && <p className="text-xs text-amber-200">{uploadStatus}</p>}
                </div>
              )}

              {hasCutout && (
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3 text-xs">
                  <span>A photo cutout is already applied to this avatar.</span>
                  <Button size="sm" variant="outline" onClick={removePhoto}><Trash2 className="h-3.5 w-3.5" /> Remove photo</Button>
                </div>
              )}
            </div>
          )}

          {step === "customize" && (
            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <div className="space-y-3">
                <div className="aspect-square overflow-hidden rounded-2xl border border-white/10">
                  <AvatarPreview3D config={draft} />
                </div>
                {hasCutout && (
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-background/40 p-3 text-xs">
                    <span>Photo cutout applied</span>
                    <Button size="sm" variant="outline" onClick={removePhoto}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
                  </div>
                )}
                <Button variant="outline" className="w-full" onClick={() => setStep("photo")}>
                  <Camera className="h-4 w-4" /> {hasCutout ? "Change photo" : "Add a photo"}
                </Button>
              </div>

              <div className="space-y-4">
                <Field label="Display name (optional)">
                  <input
                    value={draft.display_name}
                    onChange={(e) => update({ display_name: e.target.value.slice(0, 40) })}
                    placeholder="How others see you"
                    className="w-full rounded-xl border border-white/10 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </Field>

                <SwatchField label="Skin tone" options={SKIN_TONES} value={draft.skin_tone} onChange={(id) => update({ skin_tone: id })} />
                <OptionField label="Body build" options={BODY_BUILDS} value={draft.body_build} onChange={(id) => update({ body_build: id })} />

                <Field label="Height">
                  <Slider
                    value={[draft.height_scale]}
                    min={HEIGHT_RANGE.min}
                    max={HEIGHT_RANGE.max}
                    step={HEIGHT_RANGE.step}
                    onValueChange={([v]) => update({ height_scale: clampHeightScale(v) })}
                  />
                </Field>

                <OptionField label="Hair style" options={HAIR_STYLES} value={draft.hair_style} onChange={(id) => update({ hair_style: id })} />
                <SwatchField label="Hair color" options={HAIR_COLORS} value={draft.hair_color} onChange={(id) => update({ hair_color: id })} />
                <SwatchField label="Outfit top color" options={OUTFIT_COLORS} value={draft.outfit_top_color} onChange={(id) => update({ outfit_top_color: id })} />
                <SwatchField label="Outfit bottom color" options={OUTFIT_COLORS} value={draft.outfit_bottom_color} onChange={(id) => update({ outfit_bottom_color: id })} />
                <OptionField label="Accessory" options={ACCESSORIES} value={draft.accessory} onChange={(id) => update({ accessory: id })} />
                <OptionField label="View mode" options={VIEW_MODES} value={draft.view_mode} onChange={(id) => update({ view_mode: id })} withDescription />

                <Field label="Avatar engine">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {QUALITY_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        disabled={!tier.available}
                        onClick={() => tier.available && update({ quality_tier: tier.id })}
                        className={`rounded-2xl border p-3 text-left text-xs transition ${draft.quality_tier === tier.id ? "border-primary bg-primary/10" : "border-white/10 bg-background/40"} ${!tier.available ? "cursor-not-allowed opacity-50" : "hover:border-white/20"}`}
                      >
                        <p className="font-semibold">{tier.label}</p>
                        <p className="mt-1 text-muted-foreground">{tier.description}</p>
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 p-4 sm:p-5">
          {step === "intro" && (
            <>
              <Button variant="outline" onClick={() => setStep("customize")}>{AVATAR_CONSENT_COPY.skipLabel}</Button>
              <Button onClick={() => setStep("photo")} disabled={!ageConfirmed || !consentChecked}>Continue to photo upload</Button>
            </>
          )}
          {step === "photo" && (
            <>
              <Button variant="outline" onClick={() => setStep("intro")}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setPhotoChoice(SOURCE_PHOTO_TYPES.NONE); setStep("customize"); }}>Skip photo</Button>
                <Button
                  onClick={() => setStep("customize")}
                  disabled={photoChoice !== SOURCE_PHOTO_TYPES.NONE && !hasCutout}
                >
                  Continue
                </Button>
              </div>
            </>
          )}
          {step === "customize" && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {hasAvatar && !confirmDelete && (
                  <Button variant="outline" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> Delete avatar</Button>
                )}
                {confirmDelete && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span>Delete your avatar and photos permanently?</span>
                    <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isSaving}>Yes, delete</Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Save Avatar
                </Button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SwatchField({ label, options, value, onChange }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.id)}
            className={`h-8 w-8 rounded-full border-2 transition ${value === opt.id ? "border-primary scale-110" : "border-white/20 hover:border-white/40"}`}
            style={{ backgroundColor: opt.color }}
          />
        ))}
      </div>
    </Field>
  );
}

function OptionField({ label, options, value, onChange, withDescription = false }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-xl border px-3 py-1.5 text-xs transition ${value === opt.id ? "border-primary bg-primary/10 text-foreground" : "border-white/10 bg-background/40 text-muted-foreground hover:border-white/20"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {withDescription && <p className="text-[11px] text-muted-foreground">{options.find((opt) => opt.id === value)?.description}</p>}
    </Field>
  );
}

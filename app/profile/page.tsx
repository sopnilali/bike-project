"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ProfilePhoto } from "@/components/profile-photo";
import { useToast } from "@/components/toast";
import {
  PROFILE_PHOTO_MAX_BYTES,
  changePassword,
  deleteProfilePhoto,
  getApiErrorMessage,
  updateMe,
  uploadProfilePhoto,
} from "@/lib/api";
import {
  Button,
  Card,
  FieldError,
  LoadingSpinner,
  PageHeader,
  inputClass,
  labelClass,
} from "@/components/ui";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(6, "Phone looks too short").max(20, "Phone looks too long"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirm: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, isLoading, refresh, setUser, photoVersion, bumpPhotoVersion } =
    useAuth();
  const toast = useToast();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  // Revoke the preview object URL on unmount only (no setState here).
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  function setPreview(file: File | null) {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setSelectedFile(file);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      previewRef.current = objectUrl;
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name, phone: user.phone });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFileSelect(file: File | undefined) {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file (JPG, PNG, WebP…).");
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setPhotoError(
        `Image is too large (max ${Math.round(PROFILE_PHOTO_MAX_BYTES / 1024 / 1024)} MB).`
      );
      return;
    }
    setPreview(file);
  }

  async function handlePhotoUpload() {
    if (!selectedFile) return;
    setPhotoError(null);
    setUploading(true);
    try {
      const updated = await uploadProfilePhoto(selectedFile);
      setUser(updated);
      bumpPhotoVersion();
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Profile photo updated.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Photo upload failed.");
      setPhotoError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoRemove() {
    setPhotoError(null);
    setRemoving(true);
    try {
      const updated = await deleteProfilePhoto();
      setUser(updated);
      bumpPhotoVersion();
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Profile photo removed.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to remove photo.");
      setPhotoError(msg);
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  }

  async function onSaveProfile(values: ProfileValues) {
    setProfileError(null);
    try {
      const updated = await updateMe(values);
      setUser(updated);
      toast.success("Profile updated.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to update profile.");
      setProfileError(msg);
      toast.error(msg);
    }
  }

  async function onChangePassword(values: PasswordValues) {
    setPasswordError(null);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to change password.");
      setPasswordError(msg);
    }
  }

  if (isLoading) return <LoadingSpinner label="Loading profile…" />;
  if (!user) {
    return (
      <Card className="p-6 text-center text-sm text-slate-600">
        You are not signed in. Please{" "}
        <a href="/login" className="font-bold text-blue-600 hover:underline">
          log in
        </a>
        .
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title="My profile"
        subtitle="GET / PUT /api/auth/me — photo via /auth/me/photo, password change."
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-bold text-slate-900">Profile details</h2>
          <p className="text-xs text-slate-500">{user.email}</p>

          <div className="mt-4 flex items-center gap-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="New profile photo preview"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-100"
              />
            ) : (
              <ProfilePhoto
                userId={user.id}
                hasPhoto={user.photoUrl != null}
                version={photoVersion}
                label={user.name || user.email}
                className="h-16 w-16 text-xl"
              />
            )}
            <div className="min-w-0 flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Choose profile photo"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {user.photoUrl ? "Change" : "Choose photo"}
                </Button>
                {selectedFile ? (
                  <Button onClick={handlePhotoUpload} disabled={uploading}>
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                ) : null}
                {user.photoUrl && !selectedFile ? (
                  <Button
                    variant="ghost"
                    onClick={handlePhotoRemove}
                    disabled={removing}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {removing ? "Removing…" : "Remove"}
                  </Button>
                ) : null}
              </div>
              <p className="mt-1.5 truncate text-xs text-slate-500">
                {selectedFile
                  ? `${selectedFile.name} — press Upload to save.`
                  : "JPG / PNG / WebP, max 5 MB."}
              </p>
            </div>
          </div>
          {photoError ? (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {photoError}
            </p>
          ) : null}

          <form
            onSubmit={profileForm.handleSubmit(onSaveProfile)}
            className="mt-4 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Full name
              </label>
              <input
                id="profile-name"
                autoComplete="name"
                className={inputClass}
                {...profileForm.register("name")}
              />
              <FieldError message={profileForm.formState.errors.name?.message} />
            </div>
            <div>
              <label htmlFor="profile-phone" className={labelClass}>
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                className={inputClass}
                {...profileForm.register("phone")}
              />
              <FieldError message={profileForm.formState.errors.phone?.message} />
            </div>
            <div>
              <label className={labelClass}>Email (read-only)</label>
              <input value={user.email} disabled className={inputClass} />
            </div>
            {profileError ? (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {profileError}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-bold text-slate-900">Change password</h2>
          <p className="text-xs text-slate-500">
            Calls <code className="font-mono">POST /api/auth/change-password</code>.
          </p>
          <form
            onSubmit={passwordForm.handleSubmit(onChangePassword)}
            className="mt-4 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="pw-current" className={labelClass}>
                Current password
              </label>
              <input
                id="pw-current"
                type="password"
                autoComplete="current-password"
                className={inputClass}
                {...passwordForm.register("currentPassword")}
              />
              <FieldError
                message={passwordForm.formState.errors.currentPassword?.message}
              />
            </div>
            <div>
              <label htmlFor="pw-new" className={labelClass}>
                New password (min 6)
              </label>
              <input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                {...passwordForm.register("newPassword")}
              />
              <FieldError
                message={passwordForm.formState.errors.newPassword?.message}
              />
            </div>
            <div>
              <label htmlFor="pw-confirm" className={labelClass}>
                Confirm new password
              </label>
              <input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                {...passwordForm.register("confirm")}
              />
              <FieldError
                message={passwordForm.formState.errors.confirm?.message}
              />
            </div>
            {passwordError ? (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {passwordError}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting
                  ? "Changing…"
                  : "Change password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

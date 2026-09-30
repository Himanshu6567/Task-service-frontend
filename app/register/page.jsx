"use client";

import axios from "axios";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  FileImage,
} from "lucide-react";
import { useLocation, useNavigate } from "../next-router";
import { useMessage } from "../providers";

const MAX_PROFILE_IMAGE_BYTES = 3 * 1024 * 1024;

async function prepareProfileImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP profile photo.");
  }
  if (file.size <= MAX_PROFILE_IMAGE_BYTES) return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const maxDimension = 1440;
    let scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    let quality = 0.82;
    let blob;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image compression is unavailable.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob) throw new Error("The selected image could not be processed.");
      if (blob.size <= MAX_PROFILE_IMAGE_BYTES) break;
      quality *= 0.8;
      scale *= 0.8;
    }

    if (!blob || blob.size > MAX_PROFILE_IMAGE_BYTES) {
      throw new Error("The photo is too large. Choose a smaller image.");
    }

    return new File([blob], "provider-profile.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    throw new Error(
      "The profile photo could not be optimized. Choose a JPG, PNG, or WebP image under 3 MB.",
    );
  } finally {
    bitmap?.close();
  }
}

export default function Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showMessage } = useMessage();
  const { email, password, name, role, mobile } = location.state || {};
  const [btnText, setBtnText] = useState("Create provider profile");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({
    name: name || "",
    email: email || "",
    password: password || "",
    mobile: mobile || "",
    role: role || "ServiceProvider",
    image: null,
    DoB: "",
    aboutYou: "",
    jobCategory: "",
    salary: "",
    workDescription: "",
    gender: "",
  });
  const handleChange = (event) => {
    const { name: field, value, type, files } = event.target;
    if (type === "file") {
      const file = files[0];
      if (
        file &&
        ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ) {
        setFormData((previous) => ({ ...previous, image: file }));
        setImagePreview(URL.createObjectURL(file));
        setError("");
      } else {
        setError("Please choose a valid image file.");
      }
    } else {
      setFormData((previous) => ({
        ...previous,
        [field]:
          field === "salary"
            ? Number(value)
            : field === "mobile"
              ? value.replace(/\D/g, "").slice(0, 10)
              : value,
      }));
      setError("");
    }
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    if (
      !formData.image ||
      !formData.DoB ||
      !formData.aboutYou.trim() ||
      !formData.jobCategory ||
      !formData.salary ||
      !formData.workDescription.trim() ||
      !formData.gender
    ) {
      setError("Complete all fields and add a profile image.");
      return;
    }

    setError("");
    setBtnText("Creating profile...");
    try {
      const profileImage = await prepareProfileImage(formData.image);
      const body = new FormData();
      [
        "name",
        "email",
        "password",
        "DoB",
        "aboutYou",
        "jobCategory",
        "salary",
        "workDescription",
        "gender",
        "mobile",
        "role",
      ].forEach((field) => body.append(field, formData[field]));
      body.append("image", profileImage);
      const response = await axios.post(
        "/api/serviceProvider/createNewServiceProvider",
        body,
      );
      if (response.status == 201) {
        showMessage("success", "Provider profile created");
        navigate("/login");
      }
    } catch (error) {
      if (error.response && error.response.status == 409)
        setError("An account with this email already exists.");
      else {
        console.error("Unable to create provider profile", error);
        setError(
          error.response?.data?.msg ||
            (error.response?.status === 413
              ? "The upload was too large. Choose a smaller profile photo and try again."
              : "") ||
            error.message ||
            "Unable to create your profile. Please try again.",
        );
      }
    } finally {
      setBtnText("Create provider profile");
    }
  };
  const categories = ["Teacher", "Babysitter", "Makeup Artist", "Driver"];
  return (
    <main className="min-h-screen bg-[#f5f8f4] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-emerald-800"
        >
          <ArrowLeft size={16} /> Back to sign up
        </button>

        <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_24px_80px_-32px_rgba(15,61,46,0.25)]">
          <div className="relative overflow-hidden bg-[#123f35] px-6 py-8 text-white sm:px-10 sm:py-10">
            <div className="absolute -right-12 -top-28 h-64 w-64 rounded-full border-[26px] border-emerald-200/10" />
            <div className="relative flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-[#123f35]">
                <BriefcaseBusiness size={23} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Provider onboarding
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Set up your service profile
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">
                  Tell nearby customers what you do, your rate, and when you can
                  help.
                </p>
              </div>
            </div>
          </div>

          <form
            className="space-y-9 p-5 sm:p-8 lg:p-10"
            onSubmit={handleSubmit}
          >
            {error && (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <section>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  1
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">Your account</h2>
                  <p className="text-xs text-slate-500">
                    These details are attached to your provider profile.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Full name
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Mobile number
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Enter exactly 10 digits"
                    required
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Email address
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Account password
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  2
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Professional details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Choose one of the services offered on UrbanAssist.
                  </p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  Service category
                  <span className="relative mt-2 block">
                    <select
                      name="jobCategory"
                      value={formData.jobCategory}
                      onChange={handleChange}
                      required
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    >
                      <option value="">Choose your service</option>
                      {categories.map((category) => (
                        <option key={category} value={category.toLowerCase()}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <ArrowRight
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                    />
                  </span>
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Date of birth
                  <input
                    type="date"
                    name="DoB"
                    value={formData.DoB}
                    onChange={handleChange}
                    required
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-2 text-sm font-semibold text-slate-700">
                    Gender
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {["male", "female"].map((value) => (
                      <label
                        key={value}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm capitalize transition ${formData.gender === value ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600 hover:border-emerald-300"}`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={value}
                          checked={formData.gender === value}
                          onChange={handleChange}
                          required
                          className="accent-emerald-700"
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="text-sm font-semibold text-slate-700">
                  Rate per service
                  <span className="relative mt-2 block">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g. 700"
                      required
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 font-normal outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                    />
                  </span>
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  About you
                  <textarea
                    name="aboutYou"
                    value={formData.aboutYou}
                    onChange={handleChange}
                    rows={3}
                    minLength={10}
                    placeholder="A short introduction customers will see on your profile"
                    required
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  Services and experience
                  <textarea
                    name="workDescription"
                    value={formData.workDescription}
                    onChange={handleChange}
                    rows={3}
                    minLength={10}
                    placeholder="Describe the work you provide and any relevant experience"
                    required
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                  3
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Profile photo
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload a clear photo. Large images are optimized before
                    upload.
                  </p>
                </div>
              </div>
              <div className="grid gap-5">
                <label className="flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
                  {imagePreview ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={imagePreview}
                        alt="Profile preview"
                        className="h-20 w-20 rounded-full object-cover"
                      />
                      <span className="text-sm font-semibold text-emerald-800">
                        Change profile photo
                      </span>
                    </div>
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm text-slate-600">
                      <FileImage size={24} className="text-emerald-700" />
                      <span className="font-semibold text-slate-800">
                        Upload a profile photo
                      </span>
                      <span className="text-xs">PNG, JPG, or WEBP</span>
                    </span>
                  )}
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleChange}
                    required={!formData.image}
                    className="sr-only"
                  />
                </label>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="h-12 rounded-xl px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={btnText === "Creating profile..."}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#123f35] px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#0c3028] disabled:cursor-wait disabled:opacity-60"
              >
                {btnText}
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

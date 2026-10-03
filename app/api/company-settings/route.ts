import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireCompanyAccess } from "@/lib/tenant-auth";

const clean = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const hex = (value: unknown) =>
  /^#[0-9a-fA-F]{6}$/.test(String(value ?? ""));

function statusFor(message: string) {
  if (message === "Authentication required.") {
    return 401;
  }

  if (
    message.includes("access") ||
    message.includes("Administrator")
  ) {
    return 403;
  }

  return 500;
}

function canManageCompany(
  platformAdmin: boolean,
  role: string | null
) {
  return (
    platformAdmin ||
    role === "company_admin"
  );
}

// =====================================================
// UPDATE COMPANY SETTINGS
// =====================================================

export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const tenant =
      await requireCompanyAccess(
        String(
          body.companySlug ?? ""
        ).trim()
      );

    if (
      !canManageCompany(
        tenant.platformAdmin,
        tenant.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator access is required to change company settings.",
        },
        { status: 403 }
      );
    }

    if (
      !hex(body.primary_colour) ||
      !hex(body.secondary_colour) ||
      (
        clean(body.accent_colour) &&
        !hex(body.accent_colour)
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Colours must use six-digit hex values such as #111827.",
        },
        { status: 400 }
      );
    }

    const name =
      String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Company name is required.",
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("companies")
      .update({
        name,
        primary_colour:
          body.primary_colour,
        secondary_colour:
          body.secondary_colour,
        accent_colour:
          clean(body.accent_colour),
        website_url:
          clean(body.website_url),
        company_address:
          clean(body.company_address),
        sender_name:
          clean(body.sender_name),
        sender_email:
          clean(body.sender_email),
        reply_to_email:
          clean(body.reply_to_email),
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        tenant.company.id
      )
      .select(
        "id,name,slug,logo_url,primary_colour,secondary_colour,accent_colour,website_url,company_address,sender_name,sender_email,reply_to_email"
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      company: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: message,
      },
      {
        status:
          statusFor(message),
      }
    );
  }
}

// =====================================================
// UPLOAD COMPANY LOGO
// =====================================================

export async function POST(
  request: NextRequest
) {
  try {
    const form =
      await request.formData();

    const companySlug =
      String(
        form.get("companySlug") ?? ""
      ).trim();

    const file =
      form.get("logo");

    const tenant =
      await requireCompanyAccess(
        companySlug
      );

    if (
      !canManageCompany(
        tenant.platformAdmin,
        tenant.role
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator access is required to change company settings.",
        },
        { status: 403 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Logo file is required.",
        },
        { status: 400 }
      );
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          error:
            "Logo must be 2 MB or smaller.",
        },
        { status: 400 }
      );
    }

    const extensions:
      Record<string, string> = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/svg+xml": "svg",
      };

    const ext =
      extensions[file.type];

    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Logo must be PNG, JPG, WebP or SVG.",
        },
        { status: 400 }
      );
    }

    const path =
      `${tenant.company.slug}/logo.${ext}`;

    const bytes =
      await file.arrayBuffer();

    const {
      error: uploadError,
    } = await supabase.storage
      .from("company-logos")
      .upload(
        path,
        bytes,
        {
          contentType:
            file.type,
          upsert: true,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicData,
    } = supabase.storage
      .from("company-logos")
      .getPublicUrl(path);

    // Cache-buster ensures a newly uploaded logo
    // immediately replaces the previous image.
    const logo_url =
      `${publicData.publicUrl}` +
      `?v=${Date.now()}`;

    const {
      error: updateError,
    } = await supabase
      .from("companies")
      .update({
        logo_url,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        tenant.company.id
      );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      logo_url,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return NextResponse.json(
      {
        error: message,
      },
      {
        status:
          statusFor(message),
      }
    );
  }
}
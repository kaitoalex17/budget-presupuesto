import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, signSessionToken } from "@/lib/auth";
import { ensureDatabaseInitialized } from "@/lib/initDb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureDatabaseInitialized();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Por favor, introduce tu email y contraseña." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas o usuario no encontrado." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Tu cuenta ha sido desactivada por el administrador." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Credenciales incorrectas o usuario no encontrado." },
        { status: 401 }
      );
    }

    // Firmar token de sesión ligero (sin imágenes ni datos pesados)
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "USER",
      credits: user.credits,
      isFlatRate: user.isFlatRate,
      companyName: user.companyName,
    });

    const response = NextResponse.json({
      success: true,
      role: user.role,
      redirectTo: user.role === "ADMIN" ? "/admin/users" : "/dashboard",
    });

    response.cookies.set("budget_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return response;
  } catch (error: unknown) {
    console.error("Error en login:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno al iniciar sesión.", details: message },
      { status: 500 }
    );
  }
}

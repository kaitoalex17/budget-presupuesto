import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
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

    // Establecer sesión segura
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "USER",
      credits: user.credits,
      isFlatRate: user.isFlatRate,
      companyName: user.companyName,
      logo: user.logo,
    });

    return NextResponse.json({
      success: true,
      role: user.role,
      redirectTo: user.role === "ADMIN" ? "/admin/users" : "/dashboard",
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno al iniciar sesión." },
      { status: 500 }
    );
  }
}

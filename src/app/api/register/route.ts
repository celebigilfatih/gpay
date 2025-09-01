import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { name, email, password } = registerSchema.parse(body);

    // E-posta adresinin daha önce kullanılıp kullanılmadığını kontrol et
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await hash(password, 10);

    // Yeni kullanıcı oluştur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    // Hassas bilgileri çıkararak kullanıcı nesnesini döndür
    const { password: _, ...result } = user;
    
    return NextResponse.json(
      { message: "Kullanıcı başarıyla oluşturuldu", user: result },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Geçersiz giriş verileri", errors: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Kayıt hatası:", error);
    return NextResponse.json(
      { message: "Kullanıcı kaydı sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
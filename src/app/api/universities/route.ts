// API: список вузов. Роль DATA.
import { NextResponse } from "next/server";
import { getAllUniversities } from "@/lib/data";

export function GET() {
  return NextResponse.json({ count: getAllUniversities().length, universities: getAllUniversities() });
}
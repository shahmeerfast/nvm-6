import { dbConnect } from "@/lib/dbConnect";
import Winery from "@/models/winery.model";
import { NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/auth";
import User from "@/models/user.model";

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const winery = await Winery.findById(id);
    if (!winery) {
      return NextResponse.json({ error: "Winery not found" }, { status: 404 });
    }
    if (user.role !== "admin" && String(winery.owner) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to delete this winery." }, { status: 403 });
    }
    const deletedWinery = await Winery.findByIdAndDelete(id);
    return NextResponse.json({
      message: "Winery deleted successfully",
      deletedWinery,
    });
  } catch (error) {
    console.error("Error deleting winery:", error);
    return NextResponse.json({ error: "Failed to delete winery" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const winery = await Winery.findById(id);
    if (!winery) {
      return NextResponse.json({ error: "Winery not found" }, { status: 404 });
    }
    if (user.role !== "admin" && String(winery.owner) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to update this winery." }, { status: 403 });
    }
    const data = await request.json();
    // Use $set to avoid unintended replacement and enable validators
    const updatedWinery = await Winery.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    return NextResponse.json({ message: "Winery updated successfully", updatedWinery });
  } catch (error) {
    console.error("Error updating winery:", error);
    return NextResponse.json({ error: "Failed to update winery" }, { status: 500 });
  }
}

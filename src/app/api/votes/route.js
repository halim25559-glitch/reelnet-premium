import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'votes.json');
        const fileData = await fs.readFile(filePath, 'utf8');
        return NextResponse.json(JSON.parse(fileData));
    } catch (e) {
        return NextResponse.json({});
    }
}

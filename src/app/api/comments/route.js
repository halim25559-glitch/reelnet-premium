import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const movieId = searchParams.get('movieId');

        const filePath = path.join(process.cwd(), 'src', 'data', 'comments.json');
        let comments = [];
        try {
            const fileData = await fs.readFile(filePath, 'utf8');
            comments = JSON.parse(fileData);
        } catch (e) {}

        if (movieId) {
            comments = comments.filter(c => c.movieId === movieId);
        }

        return NextResponse.json(comments);
    } catch (e) {
        return NextResponse.json([]);
    }
}

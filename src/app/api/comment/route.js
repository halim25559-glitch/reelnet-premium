import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
    try {
        const { movieId, username, text, avatar } = await req.json();
        if (!movieId || !text) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

        const filePath = path.join(process.cwd(), 'src', 'data', 'comments.json');
        let comments = [];
        try {
            const fileData = await fs.readFile(filePath, 'utf8');
            comments = JSON.parse(fileData);
        } catch (e) {}

        const newComment = {
            id: Date.now().toString(),
            movieId,
            username: username || 'Anonymous Guest',
            avatar: avatar || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png',
            text,
            timestamp: new Date().toISOString()
        };

        comments.push(newComment);
        await fs.writeFile(filePath, JSON.stringify(comments, null, 2));

        return NextResponse.json({ success: true, comment: newComment });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

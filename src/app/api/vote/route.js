import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const filePath = path.join(process.cwd(), 'src', 'data', 'votes.json');
        let votes = {};
        try {
            const fileData = await fs.readFile(filePath, 'utf8');
            votes = JSON.parse(fileData);
        } catch (e) {}

        votes[id] = (votes[id] || 0) + 1;
        await fs.writeFile(filePath, JSON.stringify(votes, null, 2));

        return NextResponse.json({ success: true, newVotes: votes[id] });
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const token = request.headers.get('authorization');
        
        if (!token) {
            return NextResponse.json({ status: false, reason: 'No token provided' }, { status: 401 });
        }

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token
            },
            body: formData
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        return NextResponse.json({ status: false, reason: 'Internal Server Error' }, { status: 500 });
    }
}

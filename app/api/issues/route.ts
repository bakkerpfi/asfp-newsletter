export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = db.prepare(`
      INSERT INTO issues (
        title,
        issue_number,
        month,
        year,
        summary
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      body.title,
      body.issue_number,
      body.month,
      body.year,
      body.summary
    );

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: String(error),
      },
      { status: 500 }
    );
  }
}
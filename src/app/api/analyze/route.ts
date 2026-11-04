import { NextRequest, NextResponse } from 'next/server';
import resultFixture from '../../../../examples/result.json';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const farm = body.farm || resultFixture.farm;
    const scenario = body.scenario || resultFixture.scenario;
    return NextResponse.json({
      ...resultFixture,
      farm,
      scenario,
    });
  } catch {
    return NextResponse.json(resultFixture);
  }
}

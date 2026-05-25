import { AppError } from "@/core/errors/app-error";
import { fail, ok } from "@/core/http/api-response";
import { requireSession } from "@/core/auth/session";
import { serverEnv } from "@/core/env/server";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(request: Request) {
  try {
    await requireSession(["admin", "dispatcher"]);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 3) {
      throw new AppError({
        message: "Provide at least 3 characters for address lookup.",
        statusCode: 400,
      });
    }

    const endpoint =
      serverEnv.MAP_GEOCODE_ENDPOINT ??
      "https://nominatim.openstreetmap.org/search";
    const url = new URL(endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "DeliveryOpsConsole/1.0",
        ...(serverEnv.MAP_GEOCODE_API_KEY
          ? { Authorization: `Bearer ${serverEnv.MAP_GEOCODE_API_KEY}` }
          : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new AppError({
        message: "Geocoding provider returned an error.",
        statusCode: 502,
      });
    }

    const results = (await response.json()) as NominatimResult[];

    return ok({
      results: results.map((result) => ({
        displayName: result.display_name,
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // If the request is for our color API, handle it here
    if (url.pathname === "/api/colors" && request.method === "POST") {
      const body = await request.text();

      const response = await fetch("https://api.huemint.com/color", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body
      });

      const data = await response.text();

      return new Response(data, {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Otherwise, serve your normal site files (html/css/js)
    return env.ASSETS.fetch(request);
  }
};
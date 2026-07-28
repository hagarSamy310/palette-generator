export async function onRequestPost(context) {
  const body = await context.request.text();

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
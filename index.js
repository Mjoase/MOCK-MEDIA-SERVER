const http = require("node:http");
const { title } = require("node:process");
const url = require("url");
const PORT = 3000;

let movies = [
  { id: 1, title: "F9: The Fast Saga", director: "Justin Lin", year: 2021 },
  { id: 2, title: "Black Panther", director: "Ryan Coogler", year: 2016 },
  { id: 3, title: "Hacker", director: "Akan Satayev", year: 2016 },
];

let series = [
  { id: 1, title: "Mr Robot", seasons: 4, genre: "Thriller", year: 2015 },
  { id: 2, title: "Blindspot", seasons: 5, genre: "Drama", year: 2015 },
  { id: 3, title: "Prison Break", seasons: 5, genre: "Drama", year: 2017 },
];

let songs = [
  { id: 1, title: "A New Day Has Come", artist: "Celine Dion", year: 2002 },
  {
    id: 2,
    title: "Spirit: Satalion of the Cimarron",
    artist: "Bryan Adams and Hans Zimmer",
    year: 2002,
  },
  {
    id: 3,
    title: "Deep House 2025",
    artist: "Pete Bellis & Tommy",
    year: 2025,
  },
];

console.log("Server initialized. Ready to handle songs, movies, and series.");

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(JSON.parse(body || "{}")));
  });
}

function getDataSet(pathname) {
  switch (pathname) {
    case "movies":
      return { data: movies, label: "movie" };
    case "series":
      return { data: series, label: "series" };
    case "songs":
      return { data: songs, label: "song" };
    default:
      return null;
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const segments = pathname.split("/");

  console.log("Incoming request:", pathname);

  const dataset = getDataSet(segments[1]);
  const id = segments[2] ? parseInt(segments[2]) : null;

  if (dataset) {
    const { data, label } = dataset;

    switch (method) {
      case "GET":
        sendJSON(res, data);
        break;

      case "POST":
        const newItem = await getBody(req);
        newItem.id = data.length ? data[data.length - 1].id + 1 : 1;
        data.push(newItem);
        sendJSON(
          res,
          {
            message: `${
              label.charAt(0).toUpperCase() + label.slice(1)
            } created successfully`,
            item: newItem,
          },
          201
        );
        break;

      case "PUT":
        if (!id) return sendJSON(res, { error: "Missing ID for update" }, 400);
        const updateIndex = data.findIndex((item) => item.id === id);
        if (updateIndex !== -1) {
          const updated = await getBody(req);
          data[updateIndex] = { ...data[updateIndex], ...updated };
          sendJSON(res, {
            message: `${
              label.charAt(0).toUpperCase() + label.slice(1)
            } updated successfully`,
            item: data[updateIndex],
          });
        } else {
          sendJSON(res, { error: `${label} not found` }, 404);
        }
        break;

      case "DELETE":
        if (!id)
          return sendJSON(res, { error: "Missing ID for deletion" }, 400);
        const deleteIndex = data.findIndex((item) => item.id === id);
        if (deleteIndex !== -1) {
          const deletedItem = data[deleteIndex];
          data.splice(deleteIndex, 1);
          sendJSON(res, {
            message: `${
              label.charAt(0).toUpperCase() + label.slice(1)
            } deleted successfully`,
            deleted: deletedItem,
          });
        } else {
          sendJSON(res, { error: `${label} not found` }, 404);
        }
        break;

      default:
        sendJSON(res, { error: "Method not allowed or missing ID" }, 405);
    }
  } else {
    sendJSON(res, { error: "Not Found" }, 404);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

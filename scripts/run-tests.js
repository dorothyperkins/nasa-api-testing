const http = require('http');
const path = require('path');
const fs = require('fs');
const newman = require('newman');

const PORT = Number(process.env.MOCK_PORT || 3050);
const HOST = '127.0.0.1';

const COLLECTIONS = [
  {
    key: 'api',
    name: 'NASA Open APIs',
    file: path.join(__dirname, '..', 'postman', 'nasa-openapis.postman_collection.json'),
    report: 'newman.html'
  },
  {
    key: 'extras',
    name: 'NASA Extras',
    file: path.join(__dirname, '..', 'postman', 'nasa-extras.postman_collection.json'),
    report: 'newman-extras.html'
  },
  {
    key: 'donki',
    name: 'NASA DONKI Extras',
    file: path.join(__dirname, '..', 'postman', 'nasa-donki-extras.postman_collection.json'),
    report: 'newman-donki-extras.html'
  }
];

function sendJSON(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function buildServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const { pathname, searchParams } = requestUrl;

    if (req.method !== 'GET') {
      res.writeHead(405);
      return res.end();
    }

    // Simple helper to echo date parameters where needed.
    const today = new Date();
    const isoDate = (date) => date.toISOString().slice(0, 10);
    const defaultDate = isoDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000));

    if (pathname === '/planetary/apod') {
      if (!searchParams.get('api_key')) {
        return sendJSON(res, 403, {
          error: 'API key missing',
          message: 'A valid api_key query parameter is required.'
        });
      }
      const requestedDate = searchParams.get('date') || defaultDate;
      return sendJSON(res, 200, {
        date: requestedDate,
        media_type: 'image',
        title: 'Mock Astronomy Picture of the Day',
        explanation: 'Static mock payload used for offline testing.',
        url: 'https://example.com/mock-apod.jpg'
      });
    }

    if (pathname === '/neo/rest/v1/feed') {
      const start = searchParams.get('start_date') || defaultDate;
      const end = searchParams.get('end_date') || defaultDate;
      const objects = {
        [start]: [{
          id: '3726710',
          name: 'Mock Object 1',
          is_potentially_hazardous_asteroid: false
        }],
        [end]: [{
          id: '3726711',
          name: 'Mock Object 2',
          is_potentially_hazardous_asteroid: true
        }]
      };
      return sendJSON(res, 200, {
        element_count: Object.values(objects).reduce((sum, arr) => sum + arr.length, 0),
        near_earth_objects: objects
      });
    }

    if (pathname === '/mars-photos/api/v1/rovers/curiosity/photos') {
      const earthDate = searchParams.get('earth_date') || defaultDate;
      return sendJSON(res, 200, {
        photos: [
          {
            id: 102693,
            sol: 1000,
            camera: {
              id: 20,
              name: 'FHAZ',
              rover_id: 5,
              full_name: 'Front Hazard Avoidance Camera'
            },
            img_src: 'https://example.com/mock-mars.jpg',
            earth_date: earthDate,
            rover: {
              id: 5,
              name: 'Curiosity',
              landing_date: '2012-08-06',
              launch_date: '2011-11-26',
              status: 'active'
            }
          }
        ]
      });
    }

    if (pathname === '/EPIC/api/natural') {
      return sendJSON(res, 200, [
        {
          identifier: 'mock-epic-item',
          caption: 'Mock EPIC entry',
          image: 'epic_1b_20220101000000',
          version: '02',
          centroid_coordinates: { lat: 12.34, lon: 56.78 },
          date: `${defaultDate} 00:00:00`
        }
      ]);
    }

    if (pathname.startsWith('/EPIC/api/natural/date/')) {
      const dateSegment = pathname.split('/').slice(-1)[0];
      return sendJSON(res, 200, [
        {
          identifier: `mock-epic-${dateSegment}`,
          caption: 'Mock EPIC archive entry',
          image: 'epic_1b_archive',
          version: '02',
          date: `${dateSegment} 00:00:00`,
          centroid_coordinates: { lat: -12.34, lon: 156.78 }
        }
      ]);
    }

    if (pathname === '/DONKI/FLR') {
      return sendJSON(res, 200, [
        {
          flrID: '2022-01-01T00:00:00-FLR',
          beginTime: `${defaultDate}T00:00Z`,
          classType: 'M1.2',
          sourceLocation: 'N20W10'
        }
      ]);
    }

    if (pathname === '/DONKI/CME') {
      return sendJSON(res, 200, [
        {
          activityID: '2022-01-01T00:00:00-CME',
          startTime: `${defaultDate}T01:00Z`,
          sourceLocation: 'N18W07',
          instruments: [{ displayName: 'SOHO/LASCO C2' }],
          link: 'https://example.com/mock-cme'
        }
      ]);
    }

    if (pathname === '/DONKI/GST') {
      return sendJSON(res, 200, [
        {
          gstID: '2022-01-01T00:00:00-GST',
          startTime: `${defaultDate}T02:00Z`,
          link: 'https://example.com/mock-gst',
          allKpIndex: [{ kpIndex: '5', observedTime: `${defaultDate}T03:00Z` }]
        }
      ]);
    }

    if (pathname === '/DONKI/RBE') {
      return sendJSON(res, 200, [
        {
          rbeID: '2022-01-01T00:00:00-RBE',
          startTime: `${defaultDate}T04:00Z`,
          eventTime: `${defaultDate}T05:00Z`,
          link: 'https://example.com/mock-rbe'
        }
      ]);
    }

    if (pathname === '/DONKI/notifications') {
      return sendJSON(res, 200, [
        {
          messageType: 'Report',
          messageIssueTime: `${defaultDate}T06:00Z`,
          messageURL: 'https://example.com/mock-notification',
          messageBody: 'Mock DONKI notification body.'
        }
      ]);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
}

function runCollection({ name, file, report }) {
  return new Promise((resolve, reject) => {
    newman.run(
      {
        collection: file,
        environment: path.join(__dirname, '..', 'postman', 'nasa-env.postman_environment.json'),
        reporters: ['cli', 'htmlextra'],
        reporter: {
          htmlextra: {
            export: path.join(__dirname, '..', 'reports', report)
          }
        },
        envVar: [
          { key: 'baseUrl', value: `http://${HOST}:${PORT}` },
          { key: 'api_key', value: 'mock-key' }
        ]
      },
      (error, summary) => {
        if (error) {
          return reject(error);
        }
        if (summary.run.failures && summary.run.failures.length > 0) {
          const failure = summary.run.failures[0];
          const err = new Error(`Collection "${name}" failed: ${failure.error && failure.error.message ? failure.error.message : 'unknown error'}`);
          err.summary = summary;
          return reject(err);
        }
        resolve(summary);
      }
    );
  });
}

async function main() {
  fs.mkdirSync(path.join(__dirname, '..', 'reports'), { recursive: true });
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    console.log('Available collections:');
    for (const col of COLLECTIONS) {
      console.log(` - ${col.key}: ${col.name}`);
    }
    return;
  }

  let selectedCollections = COLLECTIONS;
  const collectionFlagIndex = args.indexOf('--collection');
  if (collectionFlagIndex !== -1) {
    const value = args[collectionFlagIndex + 1];
    if (!value) {
      throw new Error('--collection flag requires a comma separated value');
    }
    const requestedKeys = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    selectedCollections = COLLECTIONS.filter((c) => requestedKeys.includes(c.key));
    if (selectedCollections.length === 0) {
      throw new Error(`No matching collections for keys: ${requestedKeys.join(', ')}`);
    }
  }

  const server = buildServer();
  await new Promise((resolve) => server.listen(PORT, HOST, resolve));
  console.log(`Mock NASA API server listening at http://${HOST}:${PORT}`);

  try {
    for (const collection of selectedCollections) {
      console.log(`\n--- Running collection: ${collection.name} (${collection.key}) ---`);
      await runCollection(collection);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
    console.log('Mock NASA API server stopped.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


const multer = require("multer");
const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }

    callback(null, true);
  },
});

const signatures = [
  { extension: "jpg", matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { extension: "png", matches: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extension: "gif", matches: (b) => b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("ascii")) },
  { extension: "webp", matches: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

function single(fieldName) {
  const parse = parser.single(fieldName);
  return (req, res, next) => parse(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return next();
    const detected = signatures.find((signature) => signature.matches(req.file.buffer));
    if (!detected) return next(Object.assign(new Error("Photo contents are not a supported image."), { status: 400 }));
    req.file.detectedExtension = detected.extension;
    return next();
  });
}

module.exports = { single };

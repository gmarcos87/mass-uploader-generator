import { v4 as uuid } from "uuid";
import JSZip from "jszip";
import { generateTriadicPalette } from "color-palette-creator";
import "./App.css";
import { useState } from "react";

const WIDTH = 1920;
const HEIGHT = 1080;

const palette = generateTriadicPalette({
  format: "hex",
  seed: uuid(),
});

const createImageWithText = (text: string) =>
  new Promise<HTMLCanvasElement>((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");

    // background constants
    const size = 20;

    const columns = WIDTH / size;
    const rows = HEIGHT / size;
    const colors = palette;

    if (ctx) {
      for (let c = 0; c < columns; c++) {
        for (let r = 0; r < rows; r++) {
          ctx.fillStyle = colors[Math.floor(colors.length * Math.random())]; // select random array element
          ctx.fillRect(size * c, size * r, size, size);
        }
      }

      ctx.font = "200px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(text, WIDTH / 2 - 100, HEIGHT / 2);

      resolve(canvas);
    }
  });

const createFiles = async (amount = 50) => {
  // create 50 images and add them to the zip file
  const zip = new JSZip();
  let csvText = `filename;name;tags\n`;

  for (let i = 0; i < amount; i++) {
    const text = i.toString();
    const canvas = await createImageWithText(text);
    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          csvText += `image-${text}.png;${text};automated\n`;
          zip.file(`image-${text}.png`, blob);
        }

        resolve();
      }, "image/png");
    });
  }

  //attach csv file
  zip.file("metadata.csv", csvText);

  // done creating images, save the zip file
  await new Promise<void>((resolve) => {
    zip.generateAsync({ type: "blob" }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date();
      a.download = `mass-uploader-${timestamp.toISOString()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    });
  });
};

function App() {
  const [isCreating, setIsCreating] = useState(false);
  const [amount, setAmount] = useState<number>();

  const create = async () => {
    setIsCreating(true);
    await createFiles(amount);
    setIsCreating(false);
  };

  return (
    <>
      {palette.map((color: string) => (
        <PaletteBox key={color} color={color} />
      ))}
      <h1>Mass uploader</h1>
      <input
        placeholder="Amount of images"
        type="number"
        value={amount || ""}
        onChange={(e) => setAmount(parseInt(e.target.value))}
      />
      <div className="card">
        <button onClick={create} disabled={isCreating}>
          {isCreating ? "Creating images" : "Download"}
        </button>
      </div>
      <p className="read-the-docs">
        Create random files for testing purposes.{" "}
      </p>
    </>
  );
}

export default App;

const PaletteBox = ({ color }: { color: string }) => (
  <div
    style={{
      width: "50px",
      height: "20px",
      backgroundColor: color,
      display: "inline-block",
    }}
  ></div>
);

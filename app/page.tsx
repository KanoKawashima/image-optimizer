'use client';

import { useState } from 'react';
import JSZip from "jszip";
import styles from './page.module.css';

export default function Home() {
  const [images, setImages] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<
    {
      originalName: string;
      name: string;
      mime: string;
      file: string;
      preview?: string;
      previewMime?: string;
      beforeSize: number;
      afterSize: number;
    }[]
  >([]);
  
  const [outputOriginal, setOutputOriginal] = useState(true);
  const [outputWebp, setOutputWebp] = useState(true);
  const [outputAvif, setOutputAvif] = useState(false);
  const [pngCompression, setPngCompression] = useState("lossy");

  const [jpgQuality, setJpgQuality] =
    useState(80);

  const [webpQuality, setWebpQuality] =
    useState(80);

  const [avifQuality, setAvifQuality] =
    useState(50);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const selectedFiles =
      Array.from(event.target.files);

    if (!validateFiles(selectedFiles))
      return;

    setImages(selectedFiles);
  };

  const validateFiles = (files: File[]) => {
    if (files.length > 20) {
      setMessage(
        "画像は20枚までアップロードできます"
      );
      return false;
    }

    const maxSize = 10 * 1024 * 1024;

    for (const file of files) {
      if (
        ![
          "image/jpeg",
          "image/png",
        ].includes(file.type)
      ) {
        setMessage(
          "JPG / PNGのみ対応しています"
        );
        return false;
      }

      if (file.size > maxSize) {
        setMessage(
          `${file.name} は10MBを超えています`
        );
        return false;
      }
    }

    setMessage("");

    return true;
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    setIsDragging(false);

    const files = Array.from(
      event.dataTransfer.files
    );

    if (!validateFiles(files)) return;

    setImages(files);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
  };

  const handleDragEnter = () => {
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleOptimize = async () => {
    if (images.length === 0) {
      setMessage("画像を選択してください");
      return;
    }

    setIsLoading(true);
    setMessage("変換中です...");
    setResults([]);

    try {
      const formData = new FormData();

      images.forEach((image) => {
        formData.append("images", image);
      });

      formData.append(
        "outputOriginal",
        String(outputOriginal)
      );

      formData.append(
        "outputWebp",
        String(outputWebp)
      );

      formData.append(
        "outputAvif",
        String(outputAvif)
      );

      formData.append(
        "pngCompression",
        pngCompression
      );

      formData.append("jpgQuality", String(jpgQuality));
      formData.append("webpQuality", String(webpQuality));
      formData.append("avifQuality", String(avifQuality));

      const response = await fetch("/api/optimize", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResults(data.files);

      setMessage(
        `${data.files.length}件生成しました`
      );
    } catch (error) {
      console.error(error);
      setMessage("変換中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleZipDownload = async () => {
    const zip = new JSZip();

    results.forEach((file) => {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "";

      let folderName = "original";

      if (extension === "webp") {
        folderName = "webp";
      }

      if (extension === "avif") {
        folderName = "avif";
      }

      zip.file(
        `${folderName}/${file.name}`,
        file.file,
        {
          base64: true,
        }
      );
    });

    const content = await zip.generateAsync({
      type: "blob",
    });

    const url = URL.createObjectURL(content);

    const link = document.createElement("a");

    link.href = url;
    const now = new Date();

    const timestamp =
      `${now.getFullYear()}`
      + `${String(now.getMonth() + 1).padStart(2, "0")}`
      + `${String(now.getDate()).padStart(2, "0")}`
      + `-`
      + `${String(now.getHours()).padStart(2, "0")}`
      + `${String(now.getMinutes()).padStart(2, "0")}`;

    link.download =
      `optimized-images-${timestamp}.zip`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const groupedResults = results.reduce<
    Record<string, typeof results>
  >((groups, file) => {
    if (!groups[file.originalName]) {
      groups[file.originalName] = [];
    }

    groups[file.originalName].push(file);

    return groups;
  }, {});

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>画像最適化ツール</h1>

      <div className={styles.gridWrap}>
        <div className={styles.card}>
          <div
            className={`${styles.dropzone} ${
              isDragging ? styles.dragging : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <label className={styles.upload}>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              画像を選択
            </label>

            <p className={styles.dropText}>
              または画像をドラッグ＆ドロップ
            </p>
          </div>

          <ul className={styles.notes}>
            <li>JPG・PNGのみ対応</li>
            <li>1ファイル10MBまで</li>
            <li>最大20枚まで</li>
            <li>画像はサーバーに保存されません</li>
          </ul>

          {images.length > 0 && (
            <div className={styles.selected}>
              <p>{images.length}枚の画像を選択中</p>

              <ul className={styles.fileList}>
                {images.map((image) => (
                  <li key={image.name}>
                    {image.name} / {(image.size / 1024).toFixed(1)}KB
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.heading}>出力形式</h2>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={outputOriginal}
              onChange={(e) =>
                setOutputOriginal(e.target.checked)
              }
            />
            JPG / PNG 最適化
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={outputWebp}
              onChange={(e) =>
                setOutputWebp(e.target.checked)
              }
            />
            WebP生成
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={outputAvif}
              onChange={(e) =>
                setOutputAvif(e.target.checked)
              }
            />
            AVIF生成
          </label>

          <h3 className={styles.subHeading}>PNG圧縮方式</h3>

          <label className={styles.radio}>
            <input
              type="radio"
              name="pngCompression"
              value="lossy"
              checked={pngCompression === "lossy"}
              onChange={(e) =>
                setPngCompression(e.target.value)
              }
            />
            高圧縮（推奨）
          </label>

          <p className={styles.radioNote}>
            画質をほぼ維持したまま軽量化します。
          </p>

          <label className={styles.radio}>
            <input
              type="radio"
              name="pngCompression"
              value="lossless"
              checked={pngCompression === "lossless"}
              onChange={(e) =>
                setPngCompression(e.target.value)
              }
            />
            可逆圧縮
          </label>

          <p className={styles.radioNote}>
            画質を一切変更せず圧縮します。
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.heading}>品質設定</h2>
          <div className={styles.accordionContent}>
            <div>
              <label className={styles.quality}>
                JPG品質<span className={styles.qualityNote}>（推奨設定：80）</span>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={jpgQuality}
                  onChange={(e) =>
                    setJpgQuality(
                      Number(e.target.value)
                    )
                  }
                />
              </label>
            </div>

            <div>
              <label className={styles.quality}>
                WebP品質<span className={styles.qualityNote}>（推奨設定：80）</span>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={webpQuality}
                  onChange={(e) =>
                    setWebpQuality(
                      Number(e.target.value)
                    )
                  }
                />
              </label>
            </div>

            <div>
              <label className={styles.quality}>
                AVIF品質<span className={styles.qualityNote}>（推奨設定：50）</span>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={avifQuality}
                  onChange={(e) =>
                    setAvifQuality(
                      Number(e.target.value)
                    )
                  }
                />
              </label>
            </div>

            <p className={styles.pngQualityNote}>
              ※PNGは設定変更できません。
            </p>
          </div>
        </div>
      </div>

      <button
        className={styles.button}
        onClick={handleOptimize}
        disabled={isLoading}
      >
        {isLoading ? "変換中..." : "変換する"}
      </button>

      {isLoading && (
        <p className={styles.loadingText}>
          変換中です...
        </p>
      )}

      {results.length > 0 && (
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>変換結果</h2>

          <p className={styles.resultCount}>{message}</p>

          <button
            className={styles.zipButton}
            onClick={handleZipDownload}
          >
            まとめてZIPダウンロード
          </button>

          <div className={styles.resultList}>
            {Object.entries(groupedResults).map(([originalName, files]) => (
              <div className={styles.resultCard} key={originalName}>
                {files[0]?.preview && (
                  <img
                    className={styles.thumbnail}
                    src={`data:${files[0].previewMime};base64,${files[0].preview}`}
                    alt={originalName}
                  />
                )}

                <h3 className={styles.resultName}>{originalName}</h3>

                <div className={styles.convertList}>
                  {files.map((file) => {
                    const extension =
                      file.name.split(".").pop()?.toLowerCase() || "";

                    const reductionRate = (
                      ((file.beforeSize - file.afterSize) / file.beforeSize) *
                      100
                    ).toFixed(0);

                    return (
                      <div className={styles.convertItem} key={file.name}>
                        <p className={styles.resultType}>{extension}</p>

                        <p className={styles.resultSize}>
                          {(file.beforeSize / 1024).toFixed(1)}KB
                          →
                          {(file.afterSize / 1024).toFixed(1)}KB
                          （{reductionRate}%削減）
                        </p>

                        <a
                          className={styles.download}
                          href={`data:${file.mime};base64,${file.file}`}
                          download={file.name}
                        >
                          {extension}をダウンロード
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
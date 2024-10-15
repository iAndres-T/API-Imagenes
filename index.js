import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import axios from 'axios';
import packg from 'fs-extra';
const { ensureDir, createWriteStream } = packg;
import { join } from 'path';
import pLimit from 'p-limit';
import dotenv from 'dotenv';
import sharp from 'sharp';
import ora from 'ora';

dotenv.config();
const app = express();
const PORT = 3000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const limit = pLimit(10);

app.use(express.static('public'));

const getFileNameFromUrl = (url, id_intervencion) => {
  const fileName = url.substring(url.lastIndexOf('/') + 1);
  return `${id_intervencion}_${fileName}`;
};

const downloadAndCompressImage = async (image, folderPath) => {
  const imageFileName = getFileNameFromUrl(image.s_ruta_web, image.id_intervencion);
  const finalImagePath = join(folderPath, imageFileName);
  
  try {
    const response = await axios({
      url: image.s_ruta_web,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = createWriteStream(finalImagePath);
    const transformStream = sharp()
      .jpeg({ quality: 70 })
      .on('error', err => console.error('Error en sharp:', err.message));


    response.data.pipe(transformStream).pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const localDate = new Date();
    await pool.query(
      `UPDATE mapgis_sirab.temp_carga_fotos
      SET fecha_descarga = $1
      WHERE id_intervencion = $2
      AND s_ruta_web = $3`,
      [localDate, image.id_intervencion, image.s_ruta_web]
    );

  } catch (error) {
    console.error(`Error al descargar o comprimir la imagen ${image.s_ruta_web}:`, error.message);
  }
};

app.get('/descargar-imagenes', async (req, res) => {
  const startTime = Date.now();
  console.log('Inicio de descarga:', new Date(startTime).toLocaleTimeString());
  const spinner = ora('Descargando imágenes...').start();

  try {
    const baseFolderPath = join(process.env.HOME || process.env.USERPROFILE, 'Documents', 'Intervenciones');

    let BATCH_SIZE = 1000;
    let offset = 0;

    while (true) {
      const { rows: images } = await pool.query(
        `SELECT id_intervencion, s_ruta_web 
        FROM mapgis_sirab.temp_carga_fotos 
        WHERE fecha_descarga IS NULL 
        ORDER BY id_intervencion 
        LIMIT $1 OFFSET $2`,
        [BATCH_SIZE, offset]
      );

      if (images.length === 0) break;

      await Promise.all(images.map(image =>
        limit(async () => {
          const folderPath = join(baseFolderPath, `${image.id_intervencion}`);
          await ensureDir(folderPath);
          return await downloadAndCompressImage(image, folderPath);
        })
      ));

      offset += BATCH_SIZE-1;   
    }

    const endTime = Date.now();
    spinner.succeed(`Descarga completada: ${new Date(endTime).toLocaleTimeString()}`);
    const duration = (endTime - startTime) / 1000;
    console.log(`Duración total: ${duration} segundos`);

    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error en la descarga de imágenes');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

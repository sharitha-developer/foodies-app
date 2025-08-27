import fs from 'node:fs';

import sql from 'better-sqlite3';
import slugify from 'slugify';
import xss from 'xss'
import { S3 } from '@aws-sdk/client-s3';

const s3 = new S3({
   region: 'ap-southeast-2'
});
const db = sql('meals.db');

export function getMeals() {
   //throw new Error('Loading meals failed');
   return db.prepare('SELECT * FROM meals').all();
}

export function getMeal(slug) {
   return db.prepare('SELECT * FROM meals WHERE slug = ?').get(slug);
}

export async function saveMeal(meal) {

   meal.slug = slugify(meal.title, { lower: true });
   meal.instructions = xss(meal.instructions);

   const extension = meal.image.name.split('.').pop();
   const fileName = `${meal.slug}.${extension}`;

   /* method of adding to local folder*/
   //const stream = fs.createWriteStream(`public/images/${fileName}`);

   const bufferedImage = await meal.image.arrayBuffer();

   s3.putObject({
      Bucket: 'sharitha-nextjs-demo-users-image',
      Key: fileName,
      Body: Buffer.from(bufferedImage),
      ContentType: meal.image.type,
   });

   /* method of adding to local folder*/
   // stream.write(Buffer.from(bufferedImage), (error) => {
   //    if (error) {
   //       throw new Error('Saving image failed!')
   //    }
   // });
   // meal.image = `/images/${fileName}`;
   meal.image = fileName;

   db.prepare(`
   INSERT INTO meals (title,summary,instructions,creator, creator_email, image, slug)   
   VALUES (@title,@summary,@instructions,@creator,@creator_email, @image, @slug)`
   ).run(meal);

}

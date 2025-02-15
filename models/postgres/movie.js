import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.PG_DATABASE_URL,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Comprobar conexión inicial
(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa:', res.rows[0]);
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
  }
})();

// Función para ejecutar consultas
const query = async (text, params = []) => {
  try {
    console.log('🟢 Ejecutando consulta:', text, 'con parámetros:', params);
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Error ejecutando consulta:', error);
    throw error;
  }
};

export class MovieModel {
  // Obtener todas las películas o filtradas por género
  static async getAll({ genre }) {
    console.log('📌 getAll');

    if (genre) {
      try {
        const lowerCaseGenre = genre.toLowerCase();

        const genres = await query(
            'SELECT id FROM genres WHERE LOWER(name) = $1;',
            [lowerCaseGenre]
        );

        if (genres.length === 0) {
          console.log('⚠️ No genre found');
          return [];
        }

        const { id } = genres[0];

        return await query(
            `SELECT m.title, m.year, m.director, m.duration, m.poster, m.rate, m.id AS movie_id
           FROM movies m
           JOIN movie_genres mg ON m.id = mg.movie_id
           WHERE mg.genre_id = $1;`,
            [id]
        );
      } catch (error) {
        console.error('❌ Error ejecutando consulta:', error);
        return [];
      }
    }

    return await query(`
    SELECT 
        m.title, 
        m.year, 
        m.director, 
        m.duration, 
        m.poster, 
        m.rate, 
        m.id,
        GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    GROUP BY m.id;
`);
  }

  // Obtener película por ID
  static async getById({ id }) {
    const result = await query(
        'SELECT title, year, director, duration, poster, rate, id FROM movies WHERE id = $1;',
        [id]
    );
    return result.length > 0 ? result[0] : null;
  }

  // Crear nueva película
  static async create({ input }) {
    const { genre: genreInput, title, year, duration, director, rate, poster } = input;

    try {
      const movieResult = await query(
          `INSERT INTO movies (title, year, director, duration, poster, rate)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
          [title, year, director, duration, poster, rate]
      );

      const { id } = movieResult[0];

      if (genreInput && genreInput.length > 0) {
        for (const genre of genreInput) {
          const genreResult = await query(
              'SELECT id FROM genres WHERE LOWER(name) = $1;',
              [genre.toLowerCase()]
          );

          if (genreResult.length > 0) {
            await query(
                'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2);',
                [id, genreResult[0].id]
            );
          }
        }
      }

      return { id, title, year, duration, director, rate, poster };
    } catch (error) {
      console.error('❌ Error creando película:', error);
      throw new Error('Error creating movie');
    }
  }

  // Eliminar película por ID
  static async delete({ id }) {
    console.log('📌 delete');

    if (!id) {
      console.error('⚠️ No ID provided for deletion');
      return { success: false, message: 'No ID provided' };
    }

    try {
      const result = await query('DELETE FROM movies WHERE id = $1;', [id]);

      if (result.rowCount === 0) {
        console.log('⚠️ No movie found with the provided ID');
        return { success: false, message: 'No movie found with the provided ID' };
      }

      console.log('✅ Movie deleted successfully');
      return { success: true, message: 'Movie deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting movie:', error);
      return { success: false, message: 'Error deleting movie', error };
    }
  }

  // Actualizar película por ID
  static async update({ id, input }) {
    console.log('📌 update');

    if (!id) {
      console.error('⚠️ No ID provided for update');
      return { success: false, message: 'No ID provided' };
    }

    if (!input || Object.keys(input).length === 0) {
      console.error('⚠️ No data provided to update');
      return { success: false, message: 'No data provided' };
    }

    try {
      const fields = Object.keys(input).map((key, index) => `${key} = $${index + 1}`).join(', ');
      const values = Object.values(input);
      values.push(id);

      const result = await query(
          `UPDATE movies SET ${fields} WHERE id = $${values.length};`,
          values
      );

      if (result.rowCount === 0) {
        console.log('⚠️ No movie found with the provided ID');
        return { success: false, message: 'No movie found with the provided ID' };
      }

      console.log('✅ Movie updated successfully');
      return { success: true, message: 'Movie updated successfully' };
    } catch (error) {
      console.error('❌ Error updating movie:', error);
      return { success: false, message: 'Error updating movie', error };
    }
  }
}
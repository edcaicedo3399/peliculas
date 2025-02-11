
import pkg from 'pg';
const { Pool } = pkg;


const pool = new Pool({
  connectionString: 'postgresql://postgres.vfhlckxptjjsynzaqmpg:Pimienta12@@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa:', res.rows[0]);
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
})();

// Función para realizar consultas
const query = async (text, params) => {
  console.log('Ejecutando consulta:', text, 'con parámetros:', params);
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Error ejecutando consulta:', error);
    throw error;
  } finally {
    client.release();
  }
};


export class MovieModel {
  static async getAll({ genre }) {
    console.log('getAll');

    if (genre) {
      try {
        const lowerCaseGenre = genre.toLowerCase();

        // Obtener el ID del género
        const result = await pool.query(
            'SELECT id, name FROM genres WHERE LOWER(name) = $1;',
            [lowerCaseGenre]
        );
        const genres = result.rows;

        if (genres.length === 0) {
          console.log('No genre found');
          return [];
        }

        const { id } = genres[0];

        // Obtener las películas asociadas al género
        const moviesResult = await pool.query(
            `SELECT
             m.title, m.year, m.director, m.duration, m.poster, m.rate, m.id AS movie_id
           FROM movies m
           JOIN movie_genres mg ON m.id = mg.movie_id
           WHERE mg.genre_id = $1;`,
            [id]
        );

        console.log(moviesResult.rows, 'movies found');
        return moviesResult.rows;
      } catch (error) {
        console.error('Error executing queries:', error);
        return [];
      }
    }

    const moviesResult = await pool.query(
        'SELECT title, year, director, duration, poster, rate, id FROM movies;'
    );
    return moviesResult.rows;
  }

  static async getById({ id }) {
    const result = await pool.query(
        `SELECT title, year, director, duration, poster, rate, id
       FROM movies WHERE id = $1;`,
        [id]
    );

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  static async create({ input }) {
    const {
      genre: genreInput, // genre is an array
      title,
      year,
      duration,
      director,
      rate,
      poster,
    } = input;

    try {
      // Crear la película
      const result = await pool.query(
          `INSERT INTO movies (title, year, director, duration, poster, rate)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
          [title, year, director, duration, poster, rate]
      );

      const { id } = result.rows[0];

      // Relacionar los géneros con la película
      if (genreInput && genreInput.length > 0) {
        for (const genre of genreInput) {
          const genreResult = await pool.query(
              'SELECT id FROM genres WHERE LOWER(name) = $1;',
              [genre.toLowerCase()]
          );

          if (genreResult.rows.length > 0) {
            const genreId = genreResult.rows[0].id;
            await pool.query(
                'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2);',
                [id, genreId]
            );
          }
        }
      }

      return { id, title, year, duration, director, rate, poster };
    } catch (e) {
      console.error('Error creating movie:', e);
      throw new Error('Error creating movie');
    }
  }

  static async delete({ id }) {
    console.log('delete');

    if (!id) {
      console.error('No ID provided for deletion');
      return { success: false, message: 'No ID provided' };
    }

    try {
      const result = await pool.query('DELETE FROM movies WHERE id = $1;', [id]);

      if (result.rowCount === 0) {
        console.log('No movie found with the provided ID');
        return { success: false, message: 'No movie found with the provided ID' };
      }

      console.log('Movie deleted successfully');
      return { success: true, message: 'Movie deleted successfully' };
    } catch (error) {
      console.error('Error deleting movie:', error);
      return { success: false, message: 'Error deleting movie', error };
    }
  }

  static async update({ id, input }) {
    console.log('update');

    if (!id) {
      console.error('No ID provided for update');
      return { success: false, message: 'No ID provided' };
    }

    if (!input || Object.keys(input).length === 0) {
      console.error('No data provided to update');
      return { success: false, message: 'No data provided' };
    }

    try {
      const fields = Object.keys(input)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');
      const values = Object.values(input);

      values.push(id);

      const result = await pool.query(
          `UPDATE movies
         SET ${fields}
         WHERE id = $${values.length};`,
          values
      );

      if (result.rowCount === 0) {
        console.log('No movie found with the provided ID');
        return { success: false, message: 'No movie found with the provided ID' };
      }

      console.log('Movie updated successfully');
      return { success: true, message: 'Movie updated successfully' };
    } catch (error) {
      console.error('Error updating movie:', error);
      return { success: false, message: 'Error updating movie', error };
    }
  }
}
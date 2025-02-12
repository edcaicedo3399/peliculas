import mysql from 'mysql2/promise'


const DEFAULT_CONFIG = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: 'root',
  database: 'moviesdb'
}
const connectionString =  DEFAULT_CONFIG;

const connection = await mysql.createConnection(connectionString)

export class MovieModel {
  static async getAll ({ genre }) {
    console.log('getAll')

    if (genre) {
      try {
        const lowerCaseGenre = genre.toLowerCase();

        // Obtener los IDs de géneros a partir del nombre
        const [genres] = await connection.query(
            'SELECT id, name FROM genres WHERE LOWER(name) = ?;',
            [lowerCaseGenre]
        );
        console.log(genres);

        // Verificar si no se encontró el género
        if (genres.length === 0) {
          console.log("no genre found");
          return [];
        }
        // Obtener el ID del género
        const [{ id }] = genres;

        // Obtener las películas asociadas al género
        const [movies] = await connection.query(
            `SELECT
               m.title, m.year,m.director,m.duration,m.poster,m.rate,
               BIN_TO_UUID(m.id) AS movie_id
             FROM movies m
                    JOIN movie_genres mg ON m.id = mg.movie_id
             WHERE mg.genre_id = ?;`,
            [id]
        );

// Ahora `movie_id` estará en formato UUID legible.
        console.log(movies, "movies found");

        console.log(movies, "movies found");
        return movies;
      } catch (error) {
        console.error("Error executing queries:", error);
        return [];
      }
    }

    const [movies] = await connection.query(
      'SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id FROM movies;'

    )

    return movies
    console.log(movies)
  }

  static async getById ({ id }) {
    const [movies] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movies WHERE id = UUID_TO_BIN(?);`,
      [id]
    )

    if (movies.length === 0) return null

    return movies[0]
  }

  static async create ({ input }) {
    const {
      genre: genreInput, // genre is an array
      title,
      year,
      duration,
      director,
      rate,
      poster
    } = input

    // todo: crear la conexión de genre

    // crypto.randomUUID()
    const [uuidResult] = await connection.query('SELECT UUID() uuid;')
    const [{ uuid }] = uuidResult

    try {
      await connection.query(
        `INSERT INTO movies (id, title, year, director, duration, poster, rate)
          VALUES (UUID_TO_BIN("${uuid}"), ?, ?, ?, ?, ?, ?);`,
        [title, year, director, duration, poster, rate]
      )
    } catch (e) {
      // puede enviarle información sensible
      throw new Error('Error creating movie')
      // enviar la traza a un servicio interno
      // sendLog(e)
    }

    const [movies] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movies WHERE id = UUID_TO_BIN(?);`,
      [uuid]
    )

    return movies[0]
  }

  static async delete ({ id }) {
    // ejercio fácil: crear el delete
      console.log('delete');
      if (!id) {
        console.error("No ID provided for deletion");
        return { success: false, message: "No ID provided" };
      }
      try {
        // Ejecutar la consulta de eliminación
        const [result] = await connection.query(
            `DELETE FROM movies WHERE id = UUID_TO_BIN(?);`,
            [id]
        );
        // Verificar si se eliminó algún registro
        if (result.affectedRows === 0) {
          console.log("No movie found with the provided ID");
          return { success: false, message: "No movie found with the provided ID" };
        }
        console.log("Movie deleted successfully");
        return { success: true, message: "Movie deleted successfully" };
      } catch (error) {
        console.error("Error deleting movie:", error);
        return { success: false, message: "Error deleting movie", error };
      }


  }

  static async update ({ id, input }) {
    // ejercicio fácil: crear el update
      console.log('update');

      if (!id) {
        console.error("No ID provided for update");
        return { success: false, message: "No ID provided" };
      }

      if (!input || Object.keys(input).length === 0) {
        console.error("No data provided to update");
        return { success: false, message: "No data provided" };
      }

      try {
        // Construir dinámicamente la consulta y los valores
        const fields = Object.keys(input)
            .map((key) => `${key} = ?`)
            .join(", ");
        const values = Object.values(input);

        // Agregar el ID al final de los valores
        values.push(id);

        // Ejecutar la consulta de actualización
        const [result] = await connection.query(
            `UPDATE movies
       SET ${fields}
       WHERE id = UUID_TO_BIN(?);`,
            values
        );

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
          console.log("No movie found with the provided ID");
          return { success: false, message: "No movie found with the provided ID" };
        }

        console.log("Movie updated successfully");
        return { success: true, message: "Movie updated successfully" };
      } catch (error) {
        console.error("Error updating movie:", error);
        return { success: false, message: "Error updating movie", error };

    }
  }
}

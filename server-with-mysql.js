import { createApp } from './app.js'

import { MovieModel } from './models/postgres/movie.js'

createApp({ movieModel: MovieModel })

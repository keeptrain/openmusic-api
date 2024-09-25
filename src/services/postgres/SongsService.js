const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModelSong } = require('../../utils');

class SongsServices {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs({
    title, performer,
  }) {
    const query = { text: 'SELECT id, title, performer FROM songs' };
    if (title || performer) {
      query.text += ' where';
    }

    if (title) {
      query.text += " title ILIKE '%' || $1 || '%'";
      query.values = [title];
    }

    if (performer) {
      if (!title) {
        query.text += " performer ILIKE '%' || $1 || '%'";
        query.values = [performer];
      } else {
        query.text += " and performer ILIKE '%' || $2 || '%'";
        query.values.push(performer);
      }
    }

    const result = await this._pool.query(query);

    return result.rows.map(mapDBToModelSong);
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    return result.rows.map(mapDBToModelSong)[0];
  }

  async editSongById(id, {
    title, year, genre, performer, duration,
  }) {
    const updatedAt = new Date().toISOString;

    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, updated_at = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongsServices;

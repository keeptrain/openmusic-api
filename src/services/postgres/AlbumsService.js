const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapDBToModelAlbum, mapDBToModelSong, mapDBToUserAlbumLikes } = require('../../utils/index');

class AlbumsServices {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, year, createdAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    const albums = result.rows.map(mapDBToModelAlbum)[0];

    if (!result.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const querySongsDetail = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };

    const resultSongsDetail = await this._pool.query(querySongsDetail);

    const songs = resultSongsDetail.rows.map(mapDBToModelSong);

    return {
      ...albums,
      songs,
    };
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async editCoverAlbumById(id, coverUrl) {
    const query = {
      text: 'UPDATE albums SET "cover" = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Sampul Album gagal diperbarui, album id tidak ditemukan');
    }
  }

  async addAlbumLikesById(userId, albumId) {
    const id = nanoid(16);

    const queryIsLike = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const isLike = await this._pool.query(queryIsLike);

    if (isLike.rowCount) {
      throw new InvariantError('Album sudah disukai');
    }

    const query = {
      text: 'INSERT into user_album_likes VALUES ($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`album_likes:${albumId}`);
  }

  async deleteAlbumLikeById(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Like Album gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.delete(`album_likes:${albumId}`);
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(`album_likes:${albumId}`);
      return {
        isCache: true,
        result: JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const result = await this._pool.query(query);
      const mappedResult = mapDBToUserAlbumLikes(result.rows[0].count);

      await this._cacheService.set(`album_likes:${albumId}`, JSON.stringify(mappedResult));

      return {
        isCache: false,
        result: mappedResult,
      };
    }
  }
}

module.exports = AlbumsServices;

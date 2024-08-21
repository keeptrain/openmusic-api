class AlbumsHandler {
  constructor(service, storageService, validator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.postLikesAlbumByIdHandler = this.postLikesAlbumByIdHandler.bind(this);
    this.deleteLikesAlbumByIdHandler = this.deleteLikesAlbumByIdHandler.bind(this);
    this.getLikesAlbumByIdHandler = this.getLikesAlbumByIdHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const album = await this._service.getAlbumById(id);
    album.coverUrl = (album.coverUrl) ? `http://${process.env.HOST}:${process.env.PORT}/upload/images/${album.coverUrl}` : null;

    const response = h.response({
      status: 'success',
      data: {
        album,
      },
    });
    response.code(200);
    return response;
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);

    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;

    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postLikesAlbumByIdHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    await this._service.getAlbumById(id);
    await this._service.addAlbumLikesById(credentialId, id);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil disukai',
    });
    response.code(201);
    return response;
  }

  async getLikesAlbumByIdHandler(request, h) {
    const { id } = request.params;

    const { isCache, result } = await this._service.getAlbumLikesById(id);

    const response = h.response({
      status: 'success',
      data: result,
    });

    if (isCache) {
      response.header('X-Data-Source', 'cache');
    } else {
      response.header('X-Data-Source', 'not-cache');
    }

    return response;
  }

  async deleteLikesAlbumByIdHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id } = request.params;

    await this._service.getAlbumById(id);
    await this._service.deleteAlbumLikeById(credentialId, id);

    return {
      status: 'success',
      message: 'Batal menyukai album',
    };
  }
}

module.exports = AlbumsHandler;

const mapDBToModelAlbum = ({
  id,
  name,
  year,
  cover,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  year,
  coverUrl: cover,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapDBToModelSong = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapDBToUserAlbumLikes = (count) => ({
  likes: parseInt(count, 10),
});

module.exports = { mapDBToModelAlbum, mapDBToModelSong, mapDBToUserAlbumLikes };

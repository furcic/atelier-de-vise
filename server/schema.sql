CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY,
  artist VARCHAR(120) NOT NULL DEFAULT 'Atelier de vise',
  address VARCHAR(240) NOT NULL DEFAULT 'Adresa atelierului va fi anunțată',
  phone VARCHAR(24) NOT NULL DEFAULT '',
  instagram VARCHAR(200) NOT NULL DEFAULT '',
  demo BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT IGNORE INTO settings (id) VALUES (1);
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) PRIMARY KEY,
  admin_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('wine','kids','adults','exhibition') NOT NULL,
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  capacity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  location VARCHAR(240) NOT NULL,
  format ENUM('group','private','exhibition') NOT NULL DEFAULT 'group',
  status ENUM('published','draft','cancelled') NOT NULL DEFAULT 'published',
  cover VARCHAR(500) NOT NULL DEFAULT '/images/workshop.jpg',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (starts_at),
  CHECK (capacity BETWEEN 1 AND 500),
  CHECK (ends_at > starts_at),
  CHECK (price >= 0)
);
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  seats INT NOT NULL DEFAULT 1,
  status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  reference CHAR(12) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY event_phone (event_id, phone),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE RESTRICT,
  CHECK (seats BETWEEN 1 AND 10)
);
CREATE TABLE IF NOT EXISTS photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  data MEDIUMBLOB NOT NULL,
  mime VARCHAR(30) NOT NULL DEFAULT 'image/webp',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS artworks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  dimensions VARCHAR(80) NOT NULL,
  medium VARCHAR(120) NOT NULL,
  image VARCHAR(500) NOT NULL DEFAULT '/images/artwork.jpg',
  status ENUM('available','reserved','sold','draft') NOT NULL DEFAULT 'available',
  CHECK (price >= 0)
);
CREATE TABLE IF NOT EXISTS artwork_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data MEDIUMBLOB NOT NULL,
  mime VARCHAR(30) NOT NULL DEFAULT 'image/webp'
);
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artwork_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  status ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE RESTRICT
);

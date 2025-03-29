SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `tbl_onu` (
  `id` int(11) NOT NULL,
  `no_internet` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `lokasi` varchar(255) NOT NULL,
  `epon_port` varchar(10) NOT NULL,
  `onu_id` int(11) NOT NULL,
  `onu_mac` varchar(20) NOT NULL,
  `status` enum('unverifed','active','suspend') NOT NULL DEFAULT 'unverifed',
  `telepon` varchar(25) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `paket` varchar(255) DEFAULT NULL,
  `alamat_lengkap` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `tbl_paket` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `speed` varchar(255) NOT NULL,
  `harga` int(11) NOT NULL,
  `normal_perangkat` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `tbl_paket` (`id`, `name`, `speed`, `harga`, `normal_perangkat`, `created_at`) VALUES
(1, 'lite internet only', '5 Mbps', 175000, '2 - 4 Perangkat', '2025-03-28 19:04:44'),
(2, 'silver internet only', '10 Mbps', 220000, '4 - 8 Perangkat', '2025-03-28 19:05:16'),
(3, 'gold internet only', '30 Mbps', 350000, '10 - 20 Perangkat', '2025-03-28 19:05:39'),
(4, 'platinum internet only', '50 Mbps', 450000, '20 - 30 Perangkat', '2025-03-28 19:05:47');

CREATE TABLE `tbl_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tbl_users` (`id`, `username`, `password`, `api_key`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$10$d102Vif4yPY1VxARfS6XGuRqUvfuulgfaZW9oR3MSvbIVjciTIo92', 'd643b321fe51c359d6b1d045407a2de2916d1c9db0f0c2c8f43c59d5c0b1558a', '2025-03-24 16:57:49', '2025-03-24 16:57:49');


CREATE TABLE `tb_onu_unauth` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT 'NA',
  `mac_onu` varchar(17) NOT NULL,
  `epon_port` varchar(50) NOT NULL,
  `onu_id` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `tbl_onu`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `tbl_paket`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `api_key` (`api_key`);

ALTER TABLE `tb_onu_unauth`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mac_onu` (`mac_onu`);

ALTER TABLE `tbl_onu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

ALTER TABLE `tbl_paket`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `tbl_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `tb_onu_unauth`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;
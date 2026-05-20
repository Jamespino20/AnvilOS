-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: db_hardwarehub
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `TRANSACTION_ID` int NOT NULL AUTO_INCREMENT,
  `RECEIPT_NUMBER` int NOT NULL,
  `GRAND_TOTAL` decimal(10,2) DEFAULT NULL,
  `BUYER_NAME` varchar(250) NOT NULL,
  `BUYER_ADDRESS` varchar(250) DEFAULT NULL,
  `BUYER_CONTACT` varchar(250) DEFAULT NULL,
  `SELLER_ID` int DEFAULT NULL,
  `SELLER_NAME` varchar(250) DEFAULT NULL,
  `TRANSACTION_TYPE` enum('Sale Walk-In','Sale PO','Restock','Adjustment','Return','Damage') NOT NULL,
  `DELIVERY_METHOD` enum('Pickup','Delivery','COD','Walk-In') NOT NULL,
  `TRANSACTION_STATUS` enum('Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Ongoing',
  `TRANSACTION_DATE` date NOT NULL,
  `CREATED_AT` datetime DEFAULT NULL,
  `UPDATED_AT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IS_RETURNED` tinyint NOT NULL DEFAULT '0',
  `RETURN_FOR_RECEIPT_NUMBER` int DEFAULT NULL,
  PRIMARY KEY (`TRANSACTION_ID`),
  KEY `SELLER_NAME_idx` (`SELLER_NAME`),
  KEY `SELLER_ID_idx` (`SELLER_ID`),
  CONSTRAINT `SELLER_ID` FOREIGN KEY (`SELLER_ID`) REFERENCES `users` (`SELLER_ID`),
  CONSTRAINT `SELLER_NAME` FOREIGN KEY (`SELLER_NAME`) REFERENCES `users` (`SELLER_NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,0,195.00,'James Bryant Espino','','',1,'James','Sale Walk-In','Walk-In','Completed','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(2,0,195.00,'James Bryant Espino','','',1,'James','Return','Walk-In','Completed','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(3,0,195.00,'James Bryant Espino','','',1,'James','Sale Walk-In','Walk-In','Completed','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(4,0,195.00,'James Bryant Espino','','',1,'James','Return','Walk-In','Completed','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(5,0,238.00,'James','','',1,'James','Sale Walk-In','Walk-In','Completed','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(6,0,238.00,'James','','',1,'James','Return','Walk-In','Cancelled','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(7,0,15210.00,'James','','',1,'James','Sale PO','Delivery','Completed','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(8,0,195.00,'delulu','','',1,'James','Sale Walk-In','Walk-In','Cancelled','2025-05-30',NULL,'2025-06-02 21:30:38',0,0),(200,0,15.00,'Jackson','','',1,'James','Sale PO','Walk-In','Completed','2025-06-08',NULL,'2025-06-08 17:17:47',0,0),(201,0,10.00,'Jackson','','',1,'James','Sale PO','Walk-In','Ongoing','2025-06-08',NULL,'2025-06-08 17:19:46',0,0),(202,0,15.00,'Jackson','','',1,'James','Return','Walk-In','Completed','2025-06-08',NULL,'2025-06-08 17:34:48',0,0),(203,0,10.00,'Jackson','','',1,'James','Sale PO','Walk-In','Ongoing','2025-06-08',NULL,'2025-06-08 22:37:45',0,0),(204,0,43.00,'eeee','','',1,'James','Sale Walk-In','Delivery','Completed','2025-06-09',NULL,'2025-06-09 10:32:14',0,0),(205,0,150.00,'benken','','',1,'James','Sale PO','COD','Cancelled','2025-06-14',NULL,'2025-06-14 09:36:41',0,0),(206,0,43.00,'eeee','','',1,'James','Return','Walk-In','Completed','2025-06-14',NULL,'2025-06-14 09:40:45',0,0),(207,0,43.00,'cccc','','',1,'James','Sale Walk-In','Walk-In','Completed','2025-06-14',NULL,'2025-06-14 09:41:37',0,0),(208,0,43.00,'cccc','','',1,'James','Return','Walk-In','Completed','2025-06-14',NULL,'2025-06-14 09:42:07',0,0),(209,0,215.00,'cccc','','',1,'James','Return','Walk-In','Completed','2025-06-14',NULL,'2025-06-14 09:43:22',0,0),(210,0,405.00,'cccc','','',1,'James','Sale Walk-In','Pickup','Completed','2025-06-14',NULL,'2025-06-14 16:31:37',0,0),(211,0,450.00,'benken','','',4,'Jane Doe','Sale Walk-In','Pickup','Completed','2025-06-14',NULL,'2025-06-14 17:23:35',0,0),(212,0,500.00,'ken','','',4,'Jane Doe','Sale Walk-In','Pickup','Completed','2025-06-14',NULL,'2025-06-14 17:25:19',0,0),(213,22351994,390.00,'benken','','',5,'John Doe','Sale Walk-In','Pickup','Completed','2025-06-16',NULL,'2025-06-16 19:48:20',0,0),(214,66775131,490.00,'benken','','',4,'Jane Doe','Sale Walk-In','Walk-In','Completed','2025-06-16',NULL,'2025-06-16 20:02:28',1,10797722),(215,10797722,490.00,'benken','','',1,'James','Return','Walk-In','Completed','2025-06-16',NULL,'2025-06-16 20:29:56',1,10797722);
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-19 22:36:24

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
-- Table structure for table `transaction_items`
--

DROP TABLE IF EXISTS `transaction_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_items` (
  `ITEM_ID` int NOT NULL AUTO_INCREMENT,
  `TRANSACTION_ID` int DEFAULT NULL,
  `PRODUCT_ID` int DEFAULT NULL,
  `PRODUCT_NAME` varchar(250) DEFAULT NULL,
  `QUANTITY` int DEFAULT NULL,
  `UNIT_PRICE` decimal(10,2) DEFAULT NULL,
  `TOTAL_PRICE` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`ITEM_ID`),
  KEY `TRANSACTION_ID` (`TRANSACTION_ID`),
  CONSTRAINT `transaction_items_ibfk_1` FOREIGN KEY (`TRANSACTION_ID`) REFERENCES `transactions` (`TRANSACTION_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_items`
--

LOCK TABLES `transaction_items` WRITE;
/*!40000 ALTER TABLE `transaction_items` DISABLE KEYS */;
INSERT INTO `transaction_items` VALUES (13,2,1,'Muriatic Acid',1,195.00,195.00),(14,3,1,'Muriatic Acid',1,195.00,195.00),(15,4,1,'Muriatic Acid',1,195.00,195.00),(16,5,1,'Muriatic Acid',1,195.00,195.00),(17,5,2,'Sheridan 1',1,43.00,43.00),(21,8,1,'Muriatic Acid',1,195.00,195.00),(28,1,1,'Muriatic Acid',1,195.00,195.00),(32,6,2,'Sheridan 1',1,43.00,43.00),(33,6,1,'Muriatic Acid',1,195.00,195.00),(41,7,1,'Muriatic Acid',78,195.00,15210.00),(49,202,507,'2z2 Screws',1,15.00,15.00),(55,201,506,'2x2 Screws',1,10.00,10.00),(65,203,506,'2x2 Screws',1,10.00,10.00),(66,204,2,'Sheridan 1',1,43.00,43.00),(67,200,507,'2z2 Screws',1,15.00,15.00),(69,205,506,'2x2 Screws',15,10.00,150.00),(70,206,2,'Sheridan 1',1,43.00,43.00),(71,207,2,'Sheridan 1',1,43.00,43.00),(72,208,2,'Sheridan 1',1,43.00,43.00),(73,209,2,'Sheridan 1',1,43.00,43.00),(74,210,4,'Hello?',9,45.00,405.00),(75,211,4,'Hello?',10,45.00,450.00),(76,212,509,'jcbp',10,50.00,500.00),(77,213,4,'Hello?',3,45.00,135.00),(78,213,507,'2z2 Screws',17,15.00,255.00),(79,214,506,'2x2 Screws',49,10.00,490.00),(80,215,506,'2x2 Screws',49,10.00,490.00);
/*!40000 ALTER TABLE `transaction_items` ENABLE KEYS */;
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

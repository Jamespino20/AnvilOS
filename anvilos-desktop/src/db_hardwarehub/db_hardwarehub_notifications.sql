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
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `NOTIFICATION_ID` int NOT NULL AUTO_INCREMENT,
  `SYSTEM_NOTIFICATIONS` varchar(250) NOT NULL,
  `MESSAGE` text NOT NULL,
  `IS_READ` tinyint NOT NULL DEFAULT '0',
  `CREATED_AT` datetime NOT NULL,
  PRIMARY KEY (`NOTIFICATION_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'Stock_506','LOW STOCK: 2x2 Screws quantity is 49 (threshold: 100)',1,'2025-06-10 22:09:48'),(2,'Stock_507','LOW STOCK: 2z2 Screws quantity is 17 (threshold: 20)',1,'2025-06-10 22:09:48'),(3,'Transaction_201','Ongoing transaction: #201 with Jackson',1,'2025-06-08 00:00:00'),(4,'Transaction_203','Ongoing transaction: #203 with Jackson',1,'2025-06-08 00:00:00'),(5,'Stock_508','LOW STOCK: JCBP quantity is 100 (threshold: 100)',1,'2025-06-14 09:32:45'),(6,'Transaction_205','Ongoing transaction: #205 with benken',1,'2025-06-14 00:00:00'),(7,'Stock_509','LOW STOCK: jcbp quantity is 10 (threshold: 100)',1,'2025-06-14 17:16:47'),(8,'Stock_509','NO STOCK: jcbp is out of stock!',1,'2025-06-14 17:25:31'),(9,'Stock_508','NO STOCK: JCBP is out of stock!',1,'2025-06-16 14:14:40'),(10,'Stock_1','NO STOCK: Muriatic Acid is out of stock!',1,'2025-06-16 14:25:20'),(11,'Stock_522','LOW STOCK: JCBP quantity is 100 (threshold: 100)',1,'2025-06-16 14:35:32'),(12,'Stock_523','NO STOCK: jcbp is out of stock!',1,'2025-06-16 14:35:32'),(13,'Stock_530','LOW STOCK: JCBP quantity is 100 (threshold: 100)',1,'2025-06-16 14:46:29'),(14,'Stock_531','NO STOCK: jcbp is out of stock!',1,'2025-06-16 14:46:29'),(15,'Stock_538','LOW STOCK: JCBP quantity is 100 (threshold: 100)',1,'2025-06-16 14:52:56'),(16,'Stock_539','NO STOCK: jcbp is out of stock!',1,'2025-06-16 14:52:56'),(17,'Stock_507','NO STOCK: 2z2 Screws is out of stock!',1,'2025-06-16 20:01:09'),(18,'Stock_506','NO STOCK: 2x2 Screws is out of stock!',1,'2025-06-16 20:02:50');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
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

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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `SELLER_ID` int NOT NULL AUTO_INCREMENT,
  `SELLER_NAME` varchar(250) NOT NULL,
  `USERNAME` varchar(250) NOT NULL,
  `PASSWORD_HASH` text NOT NULL,
  `EMAIL` varchar(250) DEFAULT NULL,
  `REGISTRY_DATE` date NOT NULL,
  `LAST_LOGIN` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IS_ACTIVE` tinyint NOT NULL DEFAULT '1',
  `SECURITY_QUESTION1` varchar(250) NOT NULL,
  `SECURITY_ANSWER1` varchar(250) NOT NULL,
  `SECURITY_QUESTION2` varchar(250) NOT NULL,
  `SECURITY_ANSWER2` varchar(250) NOT NULL,
  `SECURITY_QUESTION3` varchar(250) NOT NULL,
  `SECURITY_ANSWER3` varchar(250) NOT NULL,
  PRIMARY KEY (`SELLER_ID`),
  UNIQUE KEY `SELLER_NAME_UNIQUE` (`SELLER_NAME`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'James','Jamespino','5ce41ada64f1e8ffb0acfaafa622b141438f3a5777785e7f0b830fb73e40d3d6','espino.jamesbryant20@gmail.com','2025-05-29','2025-06-19 21:45:41',0,'What was your first pet\'s name?','Butchoy','What is your birthplace?','Malolos','What is your favorite color?','Brown'),(4,'Jane Doe','janedo3','3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121','janedo3@gmail.com','2025-06-04','2025-06-19 22:09:40',0,'What was your first pet\'s name?','Midnight','What is your birthplace?','Malolos','What is your favorite color?','Brown'),(5,'John Doe','johndo3','5ce41ada64f1e8ffb0acfaafa622b141438f3a5777785e7f0b830fb73e40d3d6','johndo3@gmail.com','2025-06-09','2025-06-19 22:00:16',0,'What was your first pet\'s name?','Midnight','What is your birthplace?','Malolos','What is your favorite color?','Brown');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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

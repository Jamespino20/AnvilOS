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
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `SUPPLIER_ID` int NOT NULL AUTO_INCREMENT,
  `IS_AVAILABLE` tinyint NOT NULL DEFAULT '1',
  `SUPPLIER_NAME` varchar(250) NOT NULL,
  `CONTACT_NAME` varchar(250) DEFAULT NULL,
  `CONTACT_NUMBER` varchar(45) DEFAULT NULL,
  `EMAIL` varchar(250) DEFAULT NULL,
  `ADDRESS` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`SUPPLIER_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,1,'Top Silver Signal Marketing Inc.','Aging',NULL,NULL,'137 RI Mc.Arthur Highway Tuktukan Guiginto Bulacan'),(2,1,'Megaworld Trading','Jhenny delos Santos',NULL,NULL,NULL),(3,1,'Orange Resources.Inc.','James Son',NULL,NULL,'10 Gasan St., Masambong, SFDM, Quezon City'),(4,1,'Fourkings Lumber and Construction Supply','Rene',NULL,'','282 DRT Highway, Brgy. Bagong Nayon, Baliuag, Bulacan'),(5,1,'LPK Construction Supply Trading','Joseph',NULL,NULL,'K-59 Anonas St. corner K-10, Project 2, Quezon City'),(6,1,'Golden Star Commercial','James Son',NULL,NULL,'Road 1, Arty Subd., Brgy. Talipapa, Novaliches, Quezon City'),(7,1,'SHERIDAN MARKETING, INC',NULL,NULL,NULL,'74 De Jesus St., Brgy. San Antonio, SFDM, Quezon City'),(8,1,'Globe International Distributor Center INC.',NULL,NULL,NULL,'228 Roosevelt Avenue, Quezon City'),(9,1,'Four Silver Jade Trading Corp.',NULL,NULL,NULL,'Rm.713 Downtown Center Bldg., 516 Q. Paredes St., Binondo, Manila'),(10,1,'SOUDOWELD INDUSTRIAL PHILS.',NULL,NULL,NULL,'10 M.Antonio St. Maysan ,Valenzuela City'),(11,1,'R.O.H TRADING AND SERVICES',NULL,NULL,NULL,'131 Cagayan Valley Road, Taal, Pulilan, Bulacan'),(12,1,'Philippine HardwareHouse Co. Inc.',NULL,NULL,NULL,'2713 Zamora St., Brgy. 097, Pasay City'),(13,1,'ARTES MYER PHILIPPINES','Lito De Leon','','','57 Sgt. Rivera St, Quezon City, 1115 Metro Manila'),(14,0,'HISENSE TRADING',NULL,NULL,NULL,'112 Kanlaon St. Cor Simoun St., Sta. Mesa Heights, Quezon City'),(15,1,'GIVM CONCRETE PRODUCT',NULL,NULL,NULL,'San Rafael, Bulacan'),(16,1,'LIROBENSON HARDWARE',NULL,NULL,NULL,'2263 Sinaglong cor. A. Francisco, Malate, Manila'),(17,1,'DILCUE TRADING',NULL,NULL,NULL,'Malabon City'),(18,1,'MORNING BRIGHT WIRES AND CABLE MARKETING',NULL,NULL,NULL,'#80 Cenacle Drive, Sanville Subd., Brgy. Culiat, Quezon City'),(19,1,'M. AYROSO LUMBER AND HARDWARE',NULL,NULL,NULL,'9 Gov. Halili Ave., Ext., Binang 2nd, Bocaue, Bulacan'),(20,1,'VE Enterprises',NULL,NULL,NULL,'Blk. 14 Lot 30 Pomelo St. Rainbow Villa. 5 Bagumbong, Caloocan City'),(21,1,'Sea King Commercial',NULL,NULL,NULL,'9428 Urna Drive Corner Cecile St., Airport Village, Parañaque City'),(22,1,'Bo De Oro',NULL,NULL,NULL,'Hanga, Sta. Rita, Guiguinto, Bulacan'),(23,1,'Supertop Trading Inc.','Mike Velarde',NULL,NULL,'41 E.porto Street Brgy Del monte SFDM,Quezon City'),(24,1,'FIREFLY ELECTRIC AND LIGHTNING CORPORATION',NULL,NULL,NULL,'Sky 1 Tower, Dasmarinas St., Binondo, Manila'),(25,1,'P.C.A.',NULL,NULL,NULL,'A&J Rosegold Compound, Circum Road, Cutcot, Angeles'),(26,1,'WT Commercial',NULL,NULL,NULL,'Valenzuela City'),(27,1,'DS COMMERCIAL',NULL,NULL,NULL,'Poblacion, San Miguel, Bulacan'),(28,1,'TAN SU AND SONS CORPORATION','',NULL,'','Bo. Tikay, Malolos, Bulacan'),(29,1,'RESTO',NULL,NULL,NULL,NULL),(30,1,'A.F. Bautista Lumber',NULL,NULL,NULL,'Poblacion, Pulilan, Bulacan'),(31,1,'New Samex Trading Eagle','Archie',NULL,NULL,'San Ildefonso, Bulacan'),(32,1,'GIVM CONCRETE PIPE',NULL,NULL,NULL,'Sampaloc, San Rafael, Bulacan'),(33,1,'Uniprime Beaver ',NULL,NULL,NULL,'226 Sumulong Hi-way,Mambugan,Antipolo'),(34,1,'NEW Grace Enterprises',NULL,NULL,NULL,'Tierra Dayao, Sta. Cruz, Guiguinto, Bulacan'),(35,1,'PARPIPES CONCRETE PRODUCTS CORP.','Ms. Oya',NULL,NULL,'KM 38, Pulong Buhangin, Sta. Maria, Bulacan'),(36,1,'Caltex Pulilan','Mr. John Luna',NULL,NULL,'Sto. Cristo, Pulilan, Bulacan');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-19 22:36:25

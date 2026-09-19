-- =============================================================================
-- NaviOps — Port Congestion Prediction & Operations Optimizer
-- Realistic Synthetic Seed Data (14 Vessels, 5 Berths, 10 Cranes, 5 Yards, 3 Disruptions)
-- Stored in src/database/seed.sql
-- All IDs are 100% valid RFC 4122 hexadecimal UUID strings (PostgreSQL 22P02 compliant)
-- =============================================================================

-- 1. Users
INSERT INTO users (id, email, full_name, role, department, password_hash) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@naviops.port', 'Capt. Michael Vance', 'admin', 'Port Authority Executive', 'naviopsport2026$d4911ef5139d94c7eb119cd888ae45158683293cfbd7906ce8e60bd92bfc6767'),
    ('22222222-2222-2222-2222-222222222222', 'ops@naviops.port', 'Elena Rostova', 'operations', 'Quayside Operations Control', 'naviopsport2026$d4911ef5139d94c7eb119cd888ae45158683293cfbd7906ce8e60bd92bfc6767'),
    ('33333333-3333-3333-3333-333333333333', 'executive@naviops.port', 'David Chen', 'viewer', 'Maritime Logistics & Analytics', 'naviopsport2026$d4911ef5139d94c7eb119cd888ae45158683293cfbd7906ce8e60bd92bfc6767');

-- 2. Berths
INSERT INTO berths (id, berth_code, berth_name, max_vessel_length, status, available_from) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'B-01', 'North Quay Ultra-Max 1', 400.00, 'Occupied', NOW() + INTERVAL '6 hours'),
    ('b0000002-0000-0000-0000-000000000002', 'B-02', 'North Quay Ultra-Max 2', 400.00, 'Maintenance', NOW() + INTERVAL '18 hours'),
    ('b0000003-0000-0000-0000-000000000003', 'B-03', 'Central Terminal Berth 3', 350.00, 'Occupied', NOW() + INTERVAL '10 hours'),
    ('b0000004-0000-0000-0000-000000000004', 'B-04', 'Central Terminal Berth 4', 320.00, 'Available', NOW()),
    ('b0000005-0000-0000-0000-000000000005', 'B-05', 'South Feeder Quay 5', 240.00, 'Available', NOW());

-- 3. Cranes
INSERT INTO cranes (id, crane_code, crane_name, capacity_per_hour, status, assigned_berth_id, available_from) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'CR-01', 'Super STS Gantry 1', 40, 'Busy', 'b0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '6 hours'),
    ('c0000002-0000-0000-0000-000000000002', 'CR-02', 'Super STS Gantry 2', 40, 'Busy', 'b0000001-0000-0000-0000-000000000001', NOW() + INTERVAL '6 hours'),
    ('c0000003-0000-0000-0000-000000000003', 'CR-03', 'Super STS Gantry 3', 38, 'Maintenance', 'b0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '14 hours'),
    ('c0000004-0000-0000-0000-000000000004', 'CR-04', 'Super STS Gantry 4', 38, 'Failed', 'b0000002-0000-0000-0000-000000000002', NOW() + INTERVAL '28 hours'),
    ('c0000005-0000-0000-0000-000000000005', 'CR-05', 'Post-Panamax STS 5', 35, 'Busy', 'b0000003-0000-0000-0000-000000000003', NOW() + INTERVAL '10 hours'),
    ('c0000006-0000-0000-0000-000000000006', 'CR-06', 'Post-Panamax STS 6', 35, 'Busy', 'b0000003-0000-0000-0000-000000000003', NOW() + INTERVAL '10 hours'),
    ('c0000007-0000-0000-0000-000000000007', 'CR-07', 'Post-Panamax STS 7', 35, 'Available', 'b0000004-0000-0000-0000-000000000004', NOW()),
    ('c0000008-0000-0000-0000-000000000008', 'CR-08', 'Post-Panamax STS 8', 32, 'Available', 'b0000004-0000-0000-0000-000000000004', NOW()),
    ('c0000009-0000-0000-0000-000000000009', 'CR-09', 'Feeder Rail STS 9', 28, 'Available', 'b0000005-0000-0000-0000-000000000005', NOW()),
    ('c0000010-0000-0000-0000-000000000010', 'CR-10', 'Feeder Rail STS 10', 28, 'Available', 'b0000005-0000-0000-0000-000000000005', NOW());

-- 4. Yards (Using valid hex 'e' prefix)
INSERT INTO yards (id, yard_code, yard_name, cargo_type, total_capacity, occupied_capacity, status) VALUES
    ('e0000001-0000-0000-0000-000000000001', 'YZ-01', 'North Container Stacking (Inbound)', 'Container', 8500, 7140, 'Normal'),
    ('e0000002-0000-0000-0000-000000000002', 'YZ-02', 'North Container Stacking (Outbound)', 'Container', 7500, 6890, 'Near Capacity'),
    ('e0000003-0000-0000-0000-000000000003', 'YZ-03', 'Central Reefer & Hazardous Yard', 'Container', 3000, 2760, 'Congested'),
    ('e0000004-0000-0000-0000-000000000004', 'YZ-04', 'South Feeder Transfer Buffer', 'Container', 5000, 2450, 'Normal'),
    ('e0000005-0000-0000-0000-000000000005', 'YZ-05', 'General & Project Cargo Depot', 'General Cargo', 4000, 1800, 'Normal');

-- 5. Vessels (Using valid hex 'f' prefix)
INSERT INTO vessels (id, vessel_code, vessel_name, shipping_line, cargo_type, cargo_volume, vessel_length, arrival_time, eta, etd, priority, status, assigned_berth_id, expected_waiting_time) VALUES
    ('f0000001-0000-0000-0000-000000000001', 'IMO-9839438', 'MSC Maya', 'MSC', 'Container', 1420, 396.00, NOW() - INTERVAL '14 hours', NOW() - INTERVAL '15 hours', NOW() + INTERVAL '6 hours', 1, 'Unloading', 'b0000001-0000-0000-0000-000000000001', 0.0),
    ('f0000002-0000-0000-0000-000000000002', 'IMO-9708693', 'CMA CGM Palais Royal', 'CMA CGM', 'Container', 980, 345.00, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '9 hours', NOW() + INTERVAL '10 hours', 2, 'Loading', 'b0000003-0000-0000-0000-000000000003', 0.0),
    ('f0000003-0000-0000-0000-000000000003', 'IMO-9632064', 'Maersk Mc-Kinney Moller', 'Maersk', 'Container', 1850, 399.00, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '24 hours', 1, 'Waiting', NULL, 5.5),
    ('f0000004-0000-0000-0000-000000000004', 'IMO-9783459', 'Cosco Shipping Taurus', 'COSCO', 'Container', 1200, 366.00, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours', 2, 'Waiting', NULL, 7.0),
    ('f0000005-0000-0000-0000-000000000005', 'IMO-9811000', 'Ever Given', 'Evergreen', 'Container', 1600, 399.90, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '30 hours', 2, 'Waiting', NULL, 8.5),
    ('f0000006-0000-0000-0000-000000000006', 'IMO-9736107', 'Hapag-Lloyd Al Jmeliyah', 'Hapag-Lloyd', 'Container', 1100, 368.00, NULL, NOW() + INTERVAL '4 hours', NOW() + INTERVAL '28 hours', 2, 'Scheduled', NULL, 3.0),
    ('f0000007-0000-0000-0000-000000000007', 'IMO-9842114', 'ONE Apus', 'Ocean Network Express', 'Container', 850, 310.00, NULL, NOW() + INTERVAL '8 hours', NOW() + INTERVAL '26 hours', 3, 'Delayed', NULL, 6.0),
    ('f0000008-0000-0000-0000-000000000008', 'IMO-9708453', 'Yang Ming Warranty', 'Yang Ming', 'Container', 920, 333.00, NULL, NOW() + INTERVAL '12 hours', NOW() + INTERVAL '34 hours', 2, 'Scheduled', NULL, 2.0),
    ('f0000009-0000-0000-0000-000000000009', 'IMO-9776171', 'OOCL Hong Kong', 'OOCL', 'Container', 1700, 399.87, NULL, NOW() + INTERVAL '16 hours', NOW() + INTERVAL '44 hours', 1, 'Scheduled', NULL, 4.0),
    ('f0000010-0000-0000-0000-000000000010', 'IMO-9694529', 'Zim Rotterdam', 'ZIM', 'Container', 650, 260.00, NULL, NOW() + INTERVAL '22 hours', NOW() + INTERVAL '38 hours', 3, 'Scheduled', NULL, 0.0),
    ('f0000011-0000-0000-0000-000000000011', 'IMO-9824980', 'HMM Algeciras', 'HMM', 'Container', 1950, 399.90, NULL, NOW() + INTERVAL '30 hours', NOW() + INTERVAL '62 hours', 1, 'Scheduled', NULL, 1.5),
    ('f0000012-0000-0000-0000-000000000012', 'IMO-9484948', 'WEC Vermeer', 'WEC Lines', 'Container', 380, 160.00, NULL, NOW() + INTERVAL '36 hours', NOW() + INTERVAL '48 hours', 4, 'Scheduled', NULL, 0.0),
    ('f0000013-0000-0000-0000-000000000013', 'IMO-9399856', 'Atlantic Star', 'ACL', 'Ro-Ro', 450, 296.00, NULL, NOW() + INTERVAL '42 hours', NOW() + INTERVAL '58 hours', 3, 'Scheduled', NULL, 0.0),
    ('f0000014-0000-0000-0000-000000000014', 'IMO-9725861', 'Unifeeder Baltic', 'Unifeeder', 'Container', 320, 140.00, NULL, NOW() + INTERVAL '50 hours', NOW() + INTERVAL '60 hours', 4, 'Scheduled', NULL, 0.0);

-- Foreign key updates for currently assigned vessels
UPDATE berths SET current_vessel_id = 'f0000001-0000-0000-0000-000000000001' WHERE id = 'b0000001-0000-0000-0000-000000000001';
UPDATE berths SET current_vessel_id = 'f0000002-0000-0000-0000-000000000002' WHERE id = 'b0000003-0000-0000-0000-000000000003';

UPDATE cranes SET current_vessel_id = 'f0000001-0000-0000-0000-000000000001' WHERE id IN ('c0000001-0000-0000-0000-000000000001', 'c0000002-0000-0000-0000-000000000002');
UPDATE cranes SET current_vessel_id = 'f0000002-0000-0000-0000-000000000002' WHERE id IN ('c0000005-0000-0000-0000-000000000005', 'c0000006-0000-0000-0000-000000000006');

-- 6. Disruptions
INSERT INTO disruptions (id, disruption_type, title, description, affected_resource_type, affected_resource_id, severity, start_time, end_time, status) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'Equipment Failure', 'CR-04 Hydraulic Hoist Failure', 'Quay crane CR-04 experienced primary hoist hydraulic seal breach during high-speed hoist cycle. Engineering team dispatched for replacement part fabrication.', 'crane', 'c0000004-0000-0000-0000-000000000004', 'High', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '25 hours', 'Active'),
    ('d0000002-0000-0000-0000-000000000002', 'Berth Maintenance', 'Berth B-02 High-Impact Fender Replacement', 'Scheduled structural refurbishment of marine pneumatic rubber fenders along section 4 of Berth B-02. Berthing suspended.', 'berth', 'b0000002-0000-0000-0000-000000000002', 'Critical', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '18 hours', 'Active'),
    ('d0000003-0000-0000-0000-000000000003', 'Weather', 'Heavy Outer Fog & Channel Speed Restriction', 'Harbor pilotage restricted navigation speed to 6 knots in outer fairway due to dense advection fog. Inbound vessels delayed by 3-5 hours.', 'port', NULL, 'Medium', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '8 hours', 'Active');

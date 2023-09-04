

insert into job_details (machine, job_name, operator_name, shift, target_qty, actual_qty, start_time, end_time)
values('WELDING B-1', '35*75', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-2', '25*85', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-3', '50*95', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-4', '50*95', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-15', '35*75', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-22', '70*130', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-25', '70*95', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-26', '25*85', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes'),
values('WELDING B-30', '50*110', 'TEST_OPERATOR', tstzrange(now(), now() + interval '420 minutes', '[)'), 3250, 0, now(), now() + interval '420 minutes');